from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import json
import redis
from typing import Optional
from core.config import settings
from core.mongo_db import get_mongo_db
from core.database import get_business_db

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

redis_client = redis.Redis(
    host=settings.REDIS_HOST, 
    port=settings.REDIS_PORT, 
    db=0, 
    decode_responses=True
)

@router.get("/")
async def get_recommendations(user_id: Optional[str] = None, mongo_db = Depends(get_mongo_db), pg_db: Session = Depends(get_business_db)):
    if user_id:
        cached_recs = redis_client.get(f"recs:{user_id}")
        if cached_recs:
            return json.loads(cached_recs)

    movies_query = text("""
        SELECT 
            m.id, 
            m.title, 
            m.poster_url, 
            array_agg(g.name) as genres
        FROM catalog_movie m
        LEFT JOIN catalog_movie_genres mg ON m.id = mg.movie_id
        LEFT JOIN catalog_genre g ON mg.genre_id = g.id
        WHERE m.is_active = true
        GROUP BY m.id
    """)
    all_movies = pg_db.execute(movies_query).fetchall()
    
    movie_dict = {}
    for m in all_movies:
        genres = [g for g in m[3] if g is not None] if m[3] else []
        movie_dict[str(m[0])] = {"id": str(m[0]), "title": m[1], "poster_url": m[2], "genres": genres}

    purchased_ids = set()
    not_interested_ids = set()
    penalized_genres = set()
    
    if user_id:
        purchased_query = text("""
            SELECT DISTINCT m.id FROM catalog_ticketorder o
            JOIN catalog_screening s ON o.screening_id = s.id 
            JOIN catalog_movie m ON s.movie_id = m.id
            WHERE o.user_id = :uid AND o.status = 'completed'
        """)
        try:
            purchased_rows = pg_db.execute(purchased_query, {"uid": user_id}).fetchall()
            purchased_ids = {str(row[0]) for row in purchased_rows}
        except Exception as e:
            print(f"Error consultando compras: {e}")

        not_interested_docs = await mongo_db.not_interested.find({"user_id": user_id}).to_list(length=None)
        not_interested_ids = {doc["movie_id"] for doc in not_interested_docs}

        discarded_genre_counts = {}
        for mid in not_interested_ids:
            movie = movie_dict.get(mid)
            if movie and movie["genres"]:
                for g in movie["genres"]:
                    discarded_genre_counts[g] = discarded_genre_counts.get(g, 0) + 1
        
        penalized_genres = {g for g, count in discarded_genre_counts.items() if count >= 3}

    available_movies = [m for mid, m in movie_dict.items() if mid not in purchased_ids and mid not in not_interested_ids]

    is_personalized = False
    recs = []
    message = "Tendencias esta semana"
    subtitle = "Calificá películas para recibir recomendaciones personalizadas"

    if user_id:
        best_rating = await mongo_db.ratings.find_one({"user_id": user_id, "score": {"$gte": 4}}, sort=[("score", -1)])
        last_watchlist = await mongo_db.watchlist.find_one({"user_id": user_id}, sort=[("added_at", -1)])
        
        auth_query = text("SELECT genre_preferences FROM auth_users WHERE id = :uid")
        try:
            user_prefs_row = pg_db.execute(auth_query, {"uid": user_id}).fetchone()
            user_prefs = user_prefs_row[0] if user_prefs_row and user_prefs_row[0] else []
        except:
            user_prefs = []

        if best_rating or last_watchlist or user_prefs:
            is_personalized = True
            message = "Recomendadas para vos"
            subtitle = "" if not penalized_genres else "Hemos ajustado las sugerencias según lo que descartaste recientemente."
            
            for m in available_movies:
                if best_rating and m["id"] == best_rating["movie_id"]: continue
                if last_watchlist and m["id"] == last_watchlist["movie_id"]: continue

                reason = ""
                if best_rating:
                    trigger_movie = movie_dict.get(best_rating["movie_id"])
                    if trigger_movie and m["genres"]:
                        valid_shared = list(set(m["genres"]).intersection(set(trigger_movie["genres"])) - penalized_genres)
                        if valid_shared:
                            reason = f"Esta película es de {valid_shared[0]}, un género que calificaste con {best_rating['score']} estrellas en '{trigger_movie['title']}'."
                
                if not reason and last_watchlist:
                     reason = f"Seleccionada especialmente basándonos en tu lista de 'Quiero ver'."
                
                if not reason and user_prefs and m["genres"]:
                     valid_shared = list(set(m["genres"]).intersection(set(user_prefs)) - penalized_genres)
                     if valid_shared:
                         reason = f"Porque marcaste '{valid_shared[0]}' como uno de tus géneros favoritos."

                if reason:
                    clean_movie = {"id": m["id"], "title": m["title"], "poster_url": m["poster_url"], "reason": reason}
                    recs.append(clean_movie)
                    
                if len(recs) == 5: break

    if not is_personalized or len(recs) < 5:
        try:
            trending_query = text("""
                SELECT m.id, COUNT(o.id) as sales FROM catalog_movie m
                LEFT JOIN catalog_screening s ON m.id = s.movie_id 
                LEFT JOIN catalog_ticketorder o ON s.id = o.screening_id
                WHERE m.is_active = true
                GROUP BY m.id ORDER BY sales DESC LIMIT 10
            """)
            trend_rows = pg_db.execute(trending_query).fetchall()
            trend_ids = [str(r[0]) for r in trend_rows]
            
            for tid in trend_ids:
                if len(recs) == 5: break
                movie = movie_dict.get(tid)
                if movie and tid not in purchased_ids and tid not in not_interested_ids and not any(r.get('id') == tid for r in recs):
                    if not set(movie["genres"]).intersection(penalized_genres):
                        recs.append({"id": movie["id"], "title": movie["title"], "poster_url": movie["poster_url"], "reason": "Esta película es tendencia por su gran volumen de ventas esta semana."})
        except Exception:
            pass
            
        if len(recs) < 5:
            for m in available_movies:
                if len(recs) == 5: break
                if not any(r.get('id') == m["id"] for r in recs) and not set(m["genres"]).intersection(penalized_genres):
                    recs.append({"id": m["id"], "title": m["title"], "poster_url": m["poster_url"], "reason": "Una de las películas más destacadas actualmente en cartelera."})

    response = {
        "is_personalized": is_personalized,
        "title": message,
        "subtitle": subtitle,
        "items": recs
    }

    if user_id:
        redis_client.setex(f"recs:{user_id}", 600, json.dumps(response))

    return response