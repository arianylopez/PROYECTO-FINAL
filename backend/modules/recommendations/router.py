from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import json
import redis
from typing import Optional

from core.mongo_db import get_mongo_db
from core.database import get_business_db

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

REDIS_HOST = "redis"
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)

@router.get("/")
async def get_recommendations(user_id: Optional[str] = None, mongo_db = Depends(get_mongo_db), pg_db: Session = Depends(get_business_db)):    
    if user_id:
        cached_recs = redis_client.get(f"recs:{user_id}")
        if cached_recs:
            return json.loads(cached_recs)

    movies_query = text("SELECT id, title, poster_url FROM catalog_movie")
    all_movies = pg_db.execute(movies_query).fetchall()
    movie_dict = {str(m[0]): {"id": str(m[0]), "title": m[1], "poster_url": m[2]} for m in all_movies}

    purchased_ids = set()
    
    if user_id:
        purchased_query = text("""
            SELECT DISTINCT m.id
            FROM catalog_ticketorder o
            JOIN catalog_screening s ON o.screening_id = s.id
            JOIN catalog_movie m ON s.movie_id = m.id
            WHERE o.user_id = :uid AND o.status = 'completed'
        """)
        try:
            purchased_rows = pg_db.execute(purchased_query, {"uid": user_id}).fetchall()
            purchased_ids = {str(row[0]) for row in purchased_rows}
        except Exception as e:
            print(f"Error consultando compras: {e}")

    available_movies = [m for mid, m in movie_dict.items() if mid not in purchased_ids]

    is_personalized = False
    recs = []
    message = "Tendencias esta semana"
    subtitle = "Calificá películas para recibir recomendaciones personalizadas"

    if user_id:
        best_rating = await mongo_db.ratings.find_one({"user_id": user_id, "score": {"$gte": 4}}, sort=[("score", -1)])
        last_watchlist = await mongo_db.watchlist.find_one({"user_id": user_id}, sort=[("added_at", -1)])

        if best_rating or last_watchlist:
            is_personalized = True
            message = "Recomendadas para vos"
            subtitle = ""
            
            for m in available_movies:
                if best_rating and m["id"] == best_rating["movie_id"]: continue
                if last_watchlist and m["id"] == last_watchlist["movie_id"]: continue

                if best_rating:
                    trigger_title = movie_dict.get(best_rating["movie_id"], {}).get("title", "una película")
                    reason = f"Porque calificaste '{trigger_title}' con {best_rating['score']}★"
                else:
                    reason = f"Porque agregaste '{last_watchlist['movie_title']}' a tu lista"

                recs.append({**m, "reason": reason})
                if len(recs) == 5: break 

    if not is_personalized:
        try:
            trending_query = text("""
                SELECT m.id, COUNT(o.id) as sales
                FROM catalog_movie m
                LEFT JOIN catalog_screening s ON m.id = s.movie_id
                LEFT JOIN catalog_ticketorder o ON s.id = o.screening_id
                GROUP BY m.id ORDER BY sales DESC LIMIT 10
            """)
            trend_rows = pg_db.execute(trending_query).fetchall()
            trend_ids = [str(r[0]) for r in trend_rows]
            
            for tid in trend_ids:
                if tid in movie_dict and tid not in purchased_ids:
                    recs.append({**movie_dict[tid], "reason": "Tendencia esta semana"})
        except Exception:
            for m in available_movies[:10]:
                recs.append({**m, "reason": "Tendencia esta semana"})

    response = {
        "is_personalized": is_personalized,
        "title": message,
        "subtitle": subtitle,
        "items": recs
    }

    if user_id:
        redis_client.setex(f"recs:{user_id}", 600, json.dumps(response))

    return response