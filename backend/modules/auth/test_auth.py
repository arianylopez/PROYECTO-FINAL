import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from main import app
from core.database import AuthBase, auth_engine, get_auth_db
from sqlalchemy.orm import sessionmaker

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=auth_engine)

def override_get_auth_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_auth_db] = override_get_auth_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    AuthBase.metadata.drop_all(bind=auth_engine)
    AuthBase.metadata.create_all(bind=auth_engine)

# ==========================================
# TESTS HU-01 (Registro)
# ==========================================

def test_register_success_adult():
    response = client.post("/auth/register", json={
        "name": "Adulto Test",
        "email": "adulto@test.com",
        "password": "SecurePassword123!",
        "birth_date": "2000-01-01",
        "device_fingerprint": "test-device-01",
        "device_name": "Test Browser"
    })
    assert response.status_code == 201
    assert response.json()["message"] == "Usuario creado exitosamente"

def test_register_blocked_minor():
    today = datetime.today()
    minor_date = (today - timedelta(days=17 * 365)).strftime("%Y-%m-%d")
    
    response = client.post("/auth/register", json={
        "name": "Menor Test",
        "email": "menor@test.com",
        "password": "SecurePassword123!",
        "birth_date": minor_date,
        "device_fingerprint": "test-device-01"
    })
    assert response.status_code == 422
    assert "mayor de 18 a" in response.text

def test_register_duplicate_email():
    payload = {
        "name": "Duplicate Test",
        "email": "duplicado@test.com",
        "password": "SecurePassword123!",
        "birth_date": "1995-05-05",
        "device_fingerprint": "test-device-01"
    }
    client.post("/auth/register", json=payload)
    response2 = client.post("/auth/register", json=payload)
    
    assert response2.status_code == 409
    assert "ya está registrado" in response2.json()["detail"]

# ==========================================
# TESTS HU-02 (Login y Dispositivos)
# ==========================================

def test_login_success_and_refresh_token_cookie():
    client.post("/auth/register", json={
        "name": "Login Test", "email": "login@test.com", 
        "password": "Password123!", "birth_date": "1990-01-01", "device_fingerprint": "dev-01"
    })
    
    response = client.post("/auth/login", json={
        "email": "login@test.com", "password": "Password123!", "device_fingerprint": "dev-01"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "refresh_token" in response.cookies 

def test_login_device_limit_exceeded():
    client.post("/auth/register", json={
        "name": "Limit Test", "email": "limit@test.com", 
        "password": "Password123!", "birth_date": "1990-01-01", "device_fingerprint": "dev-01"
    })
    
    client.post("/auth/login", json={"email": "limit@test.com", "password": "Password123!", "device_fingerprint": "dev-02"})
    client.post("/auth/login", json={"email": "limit@test.com", "password": "Password123!", "device_fingerprint": "dev-03"})
    
    response = client.post("/auth/login", json={
        "email": "limit@test.com", "password": "Password123!", "device_fingerprint": "dev-04"
    })
    
    assert response.status_code == 403
    data = response.json()
    assert "Límite de dispositivos alcanzado" in data["detail"]
    assert len(data["devices"]) == 3 