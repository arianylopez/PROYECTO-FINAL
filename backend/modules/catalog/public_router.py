from fastapi import APIRouter, Query, HTTPException
from elasticsearch import Elasticsearch
import redis
import json
import os

router = APIRouter(prefix="/catalog", tags=["Public Catalog"])

ES_HOST = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
es = Elasticsearch(ES_HOST)

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)

@router.get("/movies")
def get_public_movies(page: int = Query(1, ge=1), size: int = Query(12, ge=1, le=50)):
    cache_key = f"public_movies_page_{page}_size_{size}"
    
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
        
        response = es.search(index="movies", body={
            "query": {"match_all": {}},
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
        
        try:
            redis_client.setex(cache_key, 300, json.dumps(result))
        except Exception:
            pass
            
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al cargar la cartelera")