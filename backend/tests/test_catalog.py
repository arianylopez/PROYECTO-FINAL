from fastapi.testclient import TestClient
from unittest.mock import patch

@patch("modules.catalog.public_router.redis_client")
@patch("modules.catalog.public_router.es")
def test_get_public_movies_cache_miss_es_hit(mock_es, mock_redis, client: TestClient):
    mock_redis.get.return_value = None
    mock_es.indices.exists.return_value = True
    mock_es.search.return_value = {
        "hits": {
            "total": {"value": 1},
            "hits": [
                {
                    "_source": {
                        "id": "1",
                        "title": "Test Movie",
                        "synopsis": "Test",
                        "director": "Director",
                        "duration_minutes": 120,
                        "rating_classification": "ATP",
                        "release_date": "2025-01-01",
                        "poster_url": "url",
                        "is_active": True
                    }
                }
            ]
        }
    }
    
    response = client.get("/api/v1/catalog/movies?page=1&size=12")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Test Movie"
    mock_redis.setex.assert_called_once()

@patch("modules.catalog.public_router.redis_client")
def test_get_public_movies_cache_hit(mock_redis, client: TestClient):
    cached_data = '{"items": [{"title": "Cached Movie"}], "total": 1, "page": 1, "size": 12, "pages": 1}'
    mock_redis.get.return_value = cached_data
    
    response = client.get("/api/v1/catalog/movies?page=1&size=12")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Cached Movie"

def test_get_public_genres(client: TestClient):
    response = client.get("/api/v1/catalog/genres")
    assert response.status_code == 200
    assert "genres" in response.json()

@patch("modules.catalog.public_router.redis_client")
def test_get_my_orders(mock_redis, client: TestClient):
    mock_redis.smembers.return_value = {"ord-1"}
    mock_redis.get.return_value = '{"id": "ord-1", "user_id": "user-1", "created_at": "2025-01-01T00:00:00Z"}'
    
    response = client.get("/api/v1/catalog/me/orders?user_id=user-1")
    assert response.status_code == 200
    data = response.json()
    assert len(data["orders"]) == 1
    assert data["orders"][0]["id"] == "ord-1"

@patch("modules.catalog.public_router.redis_client")
def test_get_order_detail_forbidden(mock_redis, client: TestClient):
    mock_redis.get.return_value = '{"id": "ord-1", "user_id": "user-2"}'
    
    response = client.get("/api/v1/catalog/me/orders/ord-1?user_id=user-1")
    assert response.status_code == 403
