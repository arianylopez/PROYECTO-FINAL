import pytest
from fastapi.testclient import TestClient

def test_register_success_adult(client: TestClient):
    response = client.post("/auth/register", json={
        "name": "Adult User",
        "email": "adult@test.com",
        "password": "Password123",
        "birth_date": "1990-01-01",
        "device_fingerprint": "abc",
        "device_name": "Test Device"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["email"] == "adult@test.com"

def test_register_blocked_minor(client: TestClient):
    response = client.post("/auth/register", json={
        "name": "Minor User",
        "email": "minor@test.com",
        "password": "Password123",
        "birth_date": "2020-01-01",
        "device_fingerprint": "abc",
        "device_name": "Test Device"
    })
    assert response.status_code == 422
    assert "Debes ser mayor de 18 años" in response.text

def test_register_weak_password_no_number(client: TestClient):
    response = client.post("/auth/register", json={
        "name": "Weak Pass User",
        "email": "weak@test.com",
        "password": "Password", 
        "birth_date": "1990-01-01",
        "device_fingerprint": "abc",
        "device_name": "Test Device"
    })
    assert response.status_code == 422
    assert "La contraseña debe tener al menos 8 caracteres y contener al menos 1 número" in response.text

def test_login_success(client: TestClient):
    client.post("/auth/register", json={
        "name": "Login User",
        "email": "login@test.com",
        "password": "Password123",
        "birth_date": "1990-01-01",
        "device_fingerprint": "abc",
        "device_name": "Test Device"
    })

    response = client.post("/auth/login", json={
        "email": "login@test.com",
        "password": "Password123",
        "device_fingerprint": "abc",
        "device_name": "Test Device"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "user" in data

def test_login_wrong_password(client: TestClient):
    client.post("/auth/register", json={
        "name": "Login User 2",
        "email": "login2@test.com",
        "password": "Password123",
        "birth_date": "1990-01-01",
        "device_fingerprint": "abc",
        "device_name": "Test Device"
    })

    response = client.post("/auth/login", json={
        "email": "login2@test.com",
        "password": "WrongPassword123",
        "device_fingerprint": "abc",
        "device_name": "Test Device"
    })
    assert response.status_code == 401
    assert "Correo o contraseña incorrectos" in response.json()["detail"]
