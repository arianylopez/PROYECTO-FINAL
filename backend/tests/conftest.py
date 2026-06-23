import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DB_USER"] = "test"
os.environ["DB_PASSWORD"] = "test"
os.environ["DB_NAME"] = "test"
os.environ["DB_HOST"] = "localhost"
os.environ["DB_PORT"] = "5432"
os.environ["ENVIRONMENT"] = "test"
os.environ["FRONTEND_URL"] = "http://localhost:5173"
os.environ["SECRET_KEY"] = "supersecret"
os.environ["ALGORITHM"] = "HS256"
os.environ["REDIS_HOST"] = "localhost"
os.environ["REDIS_PORT"] = "6379"
os.environ["MONGO_URL"] = "mongodb://localhost:27017"
os.environ["MONGO_DB"] = "test"
os.environ["KAFKA_BOOTSTRAP_SERVERS"] = "localhost:9092"

from main import app
from core.database import AuthBase, BusinessBase, get_auth_db, get_business_db
from core.config import settings

import core.database
core.database.AUTH_DB_URL = "sqlite:///./test_auth.db"
core.database.BUSINESS_DB_URL = "sqlite:///./test_business.db"
core.database.auth_engine = create_engine(core.database.AUTH_DB_URL, connect_args={"check_same_thread": False})
core.database.business_engine = create_engine(core.database.BUSINESS_DB_URL, connect_args={"check_same_thread": False})

AUTH_DB_TEST_URL = "sqlite:///./test_auth.db"
BUSINESS_DB_TEST_URL = "sqlite:///./test_business.db"

auth_engine_test = create_engine(AUTH_DB_TEST_URL, connect_args={"check_same_thread": False})
business_engine_test = create_engine(BUSINESS_DB_TEST_URL, connect_args={"check_same_thread": False})

TestingAuthSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=auth_engine_test)
TestingBusinessSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=business_engine_test)

@pytest.fixture(scope="session")
def setup_databases():
    AuthBase.metadata.create_all(bind=auth_engine_test)
    BusinessBase.metadata.create_all(bind=business_engine_test)
    yield
    AuthBase.metadata.drop_all(bind=auth_engine_test)
    BusinessBase.metadata.drop_all(bind=business_engine_test)

@pytest.fixture
def auth_db_session(setup_databases):
    db = TestingAuthSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def business_db_session(setup_databases):
    db = TestingBusinessSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(auth_db_session, business_db_session):
    def override_get_auth_db():
        try:
            yield auth_db_session
        finally:
            pass

    def override_get_business_db():
        try:
            yield business_db_session
        finally:
            pass

    app.dependency_overrides[get_auth_db] = override_get_auth_db
    app.dependency_overrides[get_business_db] = override_get_business_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
