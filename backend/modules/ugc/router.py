from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import json
import redis
from confluent_kafka import Producer
from sqlalchemy.orm import Session
from sqlalchemy import text

from core.mongo_db import get_mongo_db
from core.database import get_business_db
from core.config import settings

router = APIRouter(prefix="/ugc", tags=["User Generated Content"])

REDIS_HOST = "redis"
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)

def get_kafka_producer():
    return Producer({'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS})

class RatingRequest(BaseModel):
    user_id: str
    user_name: str
    score: int = Field(..., ge=1, le=5)

class ReviewRequest(BaseModel):
    user_id: str
    user_name: str
    text: str = Field(..., max_length=500)

class WatchlistRequest(BaseModel):
    user_id: str
    movie_title: str
    poster_url: str

class NotInterestedRequest(BaseModel):
    user_id: str

@router.post("/movies/{movie_id}/rate")
async def submit_rating(movie_id: str, req: RatingRequest, db = Depends(get_mongo_db)):
    now = datetime.now(timezone.utc)
    await db.ratings.update_one(
        {"movie_id": movie_id, "user_id": req.user_id},
        {"$set": {"score": req.score, "user_name": req.user_name, "updated_at": now}},
        upsert=True
    )
    redis_client.delete(f"recs:{req.user_id}")
    
    event = {"type": "ugc.rating_submitted", "user_id": req.user_id, "movie_id": movie_id, "score": req.score, "timestamp": now.isoformat()}
    try:
        producer = get_kafka_producer()
        producer.produce("ugc_events", value=json.dumps(event).encode('utf-8'))
        producer.flush(2.0)
    except Exception: pass
    return {"message": "Calificación registrada con éxito"}

@router.post("/movies/{movie_id}/review")
async def submit_review(movie_id: str, req: ReviewRequest, db = Depends(get_mongo_db)):
    rating = await db.ratings.find_one({"movie_id": movie_id, "user_id": req.user_id})
    if not rating: raise HTTPException(400, "Debes calificar la película antes de escribir una reseña.")
        
    await db.reviews.update_one(
        {"movie_id": movie_id, "user_id": req.user_id},
        {"$set": {"text": req.text, "user_name": req.user_name, "score": rating["score"], "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"message": "Reseña publicada con éxito"}

@router.get("/movies/{movie_id}/reviews")
async def get_reviews(movie_id: str, db = Depends(get_mongo_db)):
    cursor = db.reviews.find({"movie_id": movie_id}).sort("updated_at", -1)
    reviews_docs = await cursor.to_list(length=50)
    reviews = [{"id": str(r["_id"]), "user_id": r["user_id"], "user_name": r["user_name"], "score": r["score"], "text": r["text"], "date": r["updated_at"].isoformat()} for r in reviews_docs]
        
    pipeline = [
        {"$match": {"movie_id": movie_id}},
        {"$group": {
            "_id": "$movie_id", "avg_score": {"$avg": "$score"}, "total_ratings": {"$sum": 1},
            "positive": {"$sum": {"$cond": [{"$gte": ["$score", 4]}, 1, 0]}},
            "neutral": {"$sum": {"$cond": [{"$eq": ["$score", 3]}, 1, 0]}},
            "negative": {"$sum": {"$cond": [{"$lte": ["$score", 2]}, 1, 0]}}
        }}
    ]
    agg_result = await db.ratings.aggregate(pipeline).to_list(length=1)

    stats = {
        "avg_score": round(agg_result[0]["avg_score"], 1) if agg_result else 0.0,
        "total_ratings": agg_result[0]["total_ratings"] if agg_result else 0,
        "positive": agg_result[0]["positive"] if agg_result else 0,
        "neutral": agg_result[0]["neutral"] if agg_result else 0,
        "negative": agg_result[0]["negative"] if agg_result else 0
    }

    return {"stats": stats, "reviews": reviews}

@router.get("/movies/{movie_id}/watchlist-status")
async def get_watchlist_status(movie_id: str, user_id: str, db = Depends(get_mongo_db)):
    item = await db.watchlist.find_one({"user_id": user_id, "movie_id": movie_id})
    return {"is_added": bool(item)}

@router.post("/movies/{movie_id}/watchlist")
async def toggle_watchlist(movie_id: str, req: WatchlistRequest, db = Depends(get_mongo_db)):
    now = datetime.now(timezone.utc)
    existing = await db.watchlist.find_one({"user_id": req.user_id, "movie_id": movie_id})
    
    if existing:
        await db.watchlist.delete_one({"_id": existing["_id"]})
        is_added = False
    else:
        await db.watchlist.insert_one({
            "user_id": req.user_id, "movie_id": movie_id, 
            "movie_title": req.movie_title, "poster_url": req.poster_url, "added_at": now
        })
        is_added = True
        redis_client.delete(f"recs:{req.user_id}")
        
        event = {"type": "ugc.watchlist_added", "user_id": req.user_id, "movie_id": movie_id, "timestamp": now.isoformat()}
        try:
            producer = get_kafka_producer()
            producer.produce("ugc_events", value=json.dumps(event).encode('utf-8'))
            producer.flush(2.0)
        except Exception: pass

    return {"is_added": is_added}

@router.get("/users/{user_id}/watchlist")
async def get_watchlist(user_id: str, db = Depends(get_mongo_db)):
    cursor = db.watchlist.find({"user_id": user_id}).sort("added_at", -1)
    items = await cursor.to_list(length=100)
    return [{
        "id": str(i["_id"]), "movie_id": i["movie_id"], "movie_title": i["movie_title"], 
        "poster_url": i["poster_url"], "added_at": i["added_at"].isoformat()
    } for i in items]

@router.get("/users/{user_id}/activity")
async def get_activity(user_id: str, mongo_db = Depends(get_mongo_db), pg_db: Session = Depends(get_business_db)):
    activities = []
    
    now = datetime.now(timezone.utc)
    
    def make_aware(dt):
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt
    
    ratings = await mongo_db.ratings.find({"user_id": user_id}).to_list(length=50)
    for r in ratings:
        activities.append({ "id": f"rat_{r['_id']}", "type": "rating", "movie_id": r["movie_id"], "title": "Calificaste una película", "description": f"Otorgaste {r['score']} estrellas.", "date": make_aware(r["updated_at"]) })
        
    reviews = await mongo_db.reviews.find({"user_id": user_id}).to_list(length=50)
    for r in reviews:
        activities.append({ "id": f"rev_{r['_id']}", "type": "review", "movie_id": r["movie_id"], "title": "Publicaste una reseña", "description": f"'{r['text'][:60]}...'", "date": make_aware(r["updated_at"]) })
        
    watchlist = await mongo_db.watchlist.find({"user_id": user_id}).to_list(length=50)
    for w in watchlist:
        date_val = w.get("added_at", now)
        activities.append({ "id": f"wat_{w['_id']}", "type": "watchlist", "movie_id": w["movie_id"], "title": "Agregado a Quiero Ver", "description": f"Añadiste '{w['movie_title']}'.", "date": make_aware(date_val) })
        
    try:
        orders_query = text("""
            SELECT o.id, m.title, o.created_at
            FROM catalog_ticketorder o
            JOIN catalog_screening s ON o.screening_id = s.id
            JOIN catalog_movie m ON s.movie_id = m.id
            WHERE o.user_id = :uid AND o.status = 'completed'
        """)
        orders = pg_db.execute(orders_query, {"uid": user_id}).fetchall()
        for o in orders:
            activities.append({ "id": f"ord_{o[0]}", "type": "purchase", "movie_id": "none", "title": "Boletos Comprados", "description": f"Adquiriste entradas para '{o[1]}'.", "date": make_aware(o[2]) })
    except Exception as e:
        print(f"Error fetching PG orders: {e}")
        
    activities.sort(key=lambda x: x["date"], reverse=True)
    
    for a in activities: 
        a["date"] = a["date"].isoformat()
        
    return activities

@router.post("/movies/{movie_id}/not-interested")
async def mark_not_interested(movie_id: str, req: NotInterestedRequest, db = Depends(get_mongo_db)):
    now = datetime.now(timezone.utc)
    
    await db.not_interested.update_one(
        {"user_id": req.user_id, "movie_id": movie_id},
        {"$set": {"added_at": now}},
        upsert=True
    )
    
    redis_client.delete(f"recs:{req.user_id}")
    
    return {"message": "Película descartada de tus recomendaciones"}