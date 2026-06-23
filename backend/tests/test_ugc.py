from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app
from core.mongo_db import get_mongo_db

def test_toggle_watchlist_add(client: TestClient):
    mock_db = AsyncMock()
    mock_db.watchlist.find_one.return_value = None
    app.dependency_overrides[get_mongo_db] = lambda: mock_db
    
    with patch("modules.ugc.router.redis_client") as mock_redis:
        with patch("modules.ugc.router.get_kafka_producer") as mock_kafka:
            response = client.post("/api/v1/ugc/movies/1/watchlist", json={
                "user_id": "u1",
                "movie_title": "Test",
                "poster_url": "url"
            })
            
    assert response.status_code == 200
    assert response.json() == {"is_added": True}
    mock_db.watchlist.insert_one.assert_called_once()
    app.dependency_overrides.pop(get_mongo_db, None)

def test_toggle_watchlist_remove(client: TestClient):
    mock_db = AsyncMock()
    mock_db.watchlist.find_one.return_value = {"_id": "123"}
    app.dependency_overrides[get_mongo_db] = lambda: mock_db
    
    with patch("modules.ugc.router.redis_client") as mock_redis:
        response = client.post("/api/v1/ugc/movies/1/watchlist", json={
            "user_id": "u1",
            "movie_title": "Test",
            "poster_url": "url"
        })
            
    assert response.status_code == 200
    assert response.json() == {"is_added": False}
    mock_db.watchlist.delete_one.assert_called_once()
    app.dependency_overrides.pop(get_mongo_db, None)

def test_submit_rating(client: TestClient):
    mock_db = AsyncMock()
    app.dependency_overrides[get_mongo_db] = lambda: mock_db
    
    with patch("modules.ugc.router.redis_client") as mock_redis:
        with patch("modules.ugc.router.get_kafka_producer") as mock_kafka:
            response = client.post("/api/v1/ugc/movies/1/rate", json={
                "user_id": "u1",
                "user_name": "Test",
                "score": 5
            })
            
    assert response.status_code == 200
    mock_db.ratings.update_one.assert_called_once()
    app.dependency_overrides.pop(get_mongo_db, None)

def test_submit_review(client: TestClient):
    mock_db = AsyncMock()
    mock_db.ratings.find_one.return_value = {"score": 4}
    app.dependency_overrides[get_mongo_db] = lambda: mock_db
    
    response = client.post("/api/v1/ugc/movies/1/review", json={
        "user_id": "u1",
        "user_name": "Test",
        "text": "Great movie"
    })
            
    assert response.status_code == 200
    mock_db.reviews.update_one.assert_called_once()
    app.dependency_overrides.pop(get_mongo_db, None)

def test_submit_review_no_rating(client: TestClient):
    mock_db = AsyncMock()
    mock_db.ratings.find_one.return_value = None
    app.dependency_overrides[get_mongo_db] = lambda: mock_db
    
    response = client.post("/api/v1/ugc/movies/1/review", json={
        "user_id": "u1",
        "user_name": "Test",
        "text": "Great movie"
    })
            
    assert response.status_code == 400
    app.dependency_overrides.pop(get_mongo_db, None)
