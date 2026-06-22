from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import json
import redis
from confluent_kafka import Producer

from core.mongo_db import get_mongo_db
from core.config import settings

router = APIRouter(prefix="/ugc", tags=["User Generated Content"])

REDIS_HOST = "redis"
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)

def get_kafka_producer():
    return Producer({'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS})

class RatingRequest(BaseModel):
    user_id: str
    user_name: str
    score: int = Field(..., ge=1, le=5, description="Calificación de 1 a 5 estrellas")

class ReviewRequest(BaseModel):
    user_id: str
    user_name: str
    text: str = Field(..., max_length=500, description="Reseña de máximo 500 caracteres")

@router.post("/movies/{movie_id}/rate")
async def submit_rating(movie_id: str, req: RatingRequest, db = Depends(get_mongo_db)):
    now = datetime.now(timezone.utc)
    
    await db.ratings.update_one(
        {"movie_id": movie_id, "user_id": req.user_id},
        {"$set": {"score": req.score, "user_name": req.user_name, "updated_at": now}},
        upsert=True
    )
    
    redis_client.delete(f"recs:{req.user_id}")
    
    event = {
        "type": "ugc.rating_submitted",
        "user_id": req.user_id,
        "movie_id": movie_id,
        "score": req.score,
        "timestamp": now.isoformat()
    }
    try:
        producer = get_kafka_producer()
        producer.produce("ugc_events", value=json.dumps(event).encode('utf-8'))
        producer.flush(2.0) 
    except Exception as e:
        print(f"[ERROR KAFKA] Silenciado para no afectar al usuario: {e}")

    return {"message": "Calificación registrada con éxito"}

@router.post("/movies/{movie_id}/review")
async def submit_review(movie_id: str, req: ReviewRequest, db = Depends(get_mongo_db)):
    rating = await db.ratings.find_one({"movie_id": movie_id, "user_id": req.user_id})
    if not rating:
        raise HTTPException(status_code=400, detail="Debes calificar la película antes de escribir una reseña.")
        
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
    
    reviews = []
    for r in reviews_docs:
        reviews.append({
            "id": str(r["_id"]), "user_id": r["user_id"], "user_name": r["user_name"],
            "score": r["score"], "text": r["text"], "date": r["updated_at"].isoformat()
        })
        
    pipeline = [
        {"$match": {"movie_id": movie_id}},
        {"$group": {
            "_id": "$movie_id", 
            "avg_score": {"$avg": "$score"}, 
            "total_ratings": {"$sum": 1},
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