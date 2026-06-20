from fastapi import APIRouter, Query, HTTPException, Depends
from elasticsearch import Elasticsearch
import redis
import json
import os
from typing import Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
from core.database import get_business_db
from datetime import datetime, timezone

router = APIRouter(prefix="/catalog", tags=["Public Catalog"])

ES_HOST = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
es = Elasticsearch(ES_HOST)

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)

@router.get("/movies")
def get_public_movies(
    page: int = Query(1, ge=1), 
    size: int = Query(12, ge=1, le=50),
    q: Optional[str] = Query(None, description="Término de búsqueda para título"),
    genre: Optional[str] = Query(None, description="Filtro exacto por nombre de género")
):
    cache_key = f"public_movies_p{page}_s{size}_q{q}_g{genre}"
    
    try:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        print(f"Redis Cache Miss/Error: {e}")

    try:
        if not es.indices.exists(index="movies"):
            return {"items": [], "total": 0, "page": page, "size": size, "pages": 0}

        from_val = (page - 1) * size
        must_clauses = []
        
        if q and len(q.strip()) >= 2:
            must_clauses.append({
                "multi_match": {
                    "query": q,
                    "fields": ["title^3", "director"], 
                    "type": "phrase_prefix" 
                }
            })
            
        if genre:
            must_clauses.append({"match_phrase": {"genres": genre}})

        es_query = {"bool": {"must": must_clauses}} if must_clauses else {"match_all": {}}

        response = es.search(index="movies", body={
            "query": es_query,
            "from": from_val,
            "size": size,
            "sort": [{"release_date": {"order": "desc", "unmapped_type": "date"}}] 
        })
        
        hits = response['hits']['hits']
        total = response['hits']['total']['value']
        movies = [hit['_source'] for hit in hits]
        
        result = {
            "items": movies,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
        
        if not q and not genre:
            try:
                redis_client.setex(cache_key, 300, json.dumps(result))
            except Exception:
                pass
            
        return result

    except Exception as e:
        print(f"Elasticsearch Error: {e}")
        raise HTTPException(status_code=500, detail="Error interno al buscar en la cartelera")
    
@router.get("/genres")
def get_public_genres(db: Session = Depends(get_business_db)):
    try:
        query = text("SELECT name FROM catalog_genre ORDER BY name ASC")
        
        result = db.execute(query).fetchall()
        genres = [row[0] for row in result]
        
        if not genres:
            return {"genres": []}
            
        return {"genres": genres}
        
    except Exception as e:
        print(f"Error al obtener géneros: {e}")
        return {"genres": []}
    
@router.get("/movies/{movie_id}")
def get_movie_detail(movie_id: str, db: Session = Depends(get_business_db)):
    try:
        movie_query = text("""
            SELECT CAST(id AS VARCHAR), title, synopsis, duration_minutes, rating_classification, director, 
                   CAST(release_date AS VARCHAR), poster_url, trailer_url 
            FROM catalog_movie 
            WHERE id = :id AND is_active = true
        """)
        movie_row = db.execute(movie_query, {"id": movie_id}).fetchone()

        if not movie_row:
            raise HTTPException(status_code=404, detail="Película no encontrada o inactiva")

        movie = {
            "id": movie_row[0], "title": movie_row[1], "synopsis": movie_row[2],
            "duration_minutes": movie_row[3], 
            "rating_classification": movie_row[4], 
            "director": movie_row[5], "release_date": movie_row[6],
            "poster_url": movie_row[7], "trailer_url": movie_row[8],
            "genres": [],
            "screenings": []
        }

        try:
            genres_query = text("""
                SELECT g.name 
                FROM catalog_genre g
                JOIN catalog_movie_genres mg ON g.id = mg.genre_id
                WHERE mg.movie_id = :id
            """)
            genres_result = db.execute(genres_query, {"id": movie_id}).fetchall()
            movie["genres"] = [row[0] for row in genres_result]
        except Exception:
            pass 

        now_utc = datetime.now(timezone.utc)
        try:
            screenings_query = text("""
                SELECT CAST(s.id AS VARCHAR), s.start_time, r.name, f.name, l.name
                FROM catalog_screening s
                JOIN catalog_room r ON s.room_id = r.id
                JOIN catalog_format f ON s.format_id = f.id
                JOIN catalog_language l ON s.language_id = l.id
                WHERE s.movie_id = :id 
                  AND s.start_time > :now 
                  AND s.is_active = true
                ORDER BY s.start_time ASC
            """)
            screenings_result = db.execute(screenings_query, {"id": movie_id, "now": now_utc}).fetchall()
            
            for s in screenings_result:
                movie["screenings"].append({
                    "id": s[0],
                    "start_time": s[1].isoformat() if hasattr(s[1], 'isoformat') else str(s[1]),
                    "room": s[2],
                    "format": s[3],
                    "language": s[4]
                })
        except Exception as se:
            print(f"[Warning] Error cargando funciones: {se}")

        return movie

    except HTTPException:
        raise
    except Exception as e:
        print(f"[CRITICAL] Error en /movies/{movie_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al cargar la película")
    
@router.get("/movies/{movie_id}/screenings")
def get_movie_screenings(movie_id: str, db: Session = Depends(get_business_db)):
    try:
        movie_query = text("""
            SELECT title, duration_minutes, rating_classification, poster_url
            FROM catalog_movie
            WHERE id = :id AND is_active = true
        """)
        movie_row = db.execute(movie_query, {"id": movie_id}).fetchone()

        if not movie_row:
            raise HTTPException(status_code=404, detail="Película no encontrada")

        now_utc = datetime.now(timezone.utc)
        screenings_query = text("""
            SELECT CAST(s.id AS VARCHAR), s.start_time, r.name as room_name, f.name as format_name, l.name as language_name
            FROM catalog_screening s
            JOIN catalog_room r ON s.room_id = r.id
            JOIN catalog_format f ON s.format_id = f.id
            JOIN catalog_language l ON s.language_id = l.id
            WHERE s.movie_id = :id 
              AND s.start_time > :now 
              AND s.is_active = true
            ORDER BY s.start_time ASC
        """)
        
        screenings_result = db.execute(screenings_query, {"id": movie_id, "now": now_utc}).fetchall()
        
        screenings = []
        for s in screenings_result:
            screenings.append({
                "id": s[0],
                "start_time": s[1].isoformat() if hasattr(s[1], 'isoformat') else str(s[1]),
                "room": s[2],
                "format": s[3],
                "language": s[4]
            })

        ticket_types = []
        try:
            tt_query = text("""
                SELECT CAST(id AS VARCHAR), name, base_price 
                FROM catalog_tickettype 
                WHERE is_active = true 
                ORDER BY base_price DESC
            """)
            tt_result = db.execute(tt_query).fetchall()
            for t in tt_result:
                ticket_types.append({
                    "id": t[0],
                    "name": t[1],
                    "price": float(t[2]) 
                })
        except Exception as e:
            print(f"[Warning] Error cargando TicketTypes desde DB: {e}")
            db.rollback()
            try:
                tt_query_fallback = text("SELECT CAST(id AS VARCHAR), name, base_price FROM catalog_tickettype ORDER BY base_price DESC")
                tt_result_fb = db.execute(tt_query_fallback).fetchall()
                for t in tt_result_fb:
                    ticket_types.append({"id": t[0], "name": t[1], "price": float(t[2])})
            except Exception as e2:
                print(f"[CRITICAL] Error final en TicketTypes: {e2}")

        return {
            "movie": {
                "id": movie_id,
                "title": movie_row[0],
                "duration_minutes": movie_row[1],
                "rating_classification": movie_row[2],
                "poster_url": movie_row[3]
            },
            "screenings": screenings,
            "ticket_types": ticket_types  
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[CRITICAL] Error en /movies/{movie_id}/screenings: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al cargar los horarios")