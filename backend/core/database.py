import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from core.config import settings

DB_USER = settings.DB_USER
DB_PASSWORD = settings.DB_PASSWORD

AUTH_DB_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@auth-db:5432/auth_db"
BUSINESS_DB_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@business-db:5432/business_db"

auth_engine = create_engine(AUTH_DB_URL, echo=False)
business_engine = create_engine(BUSINESS_DB_URL, echo=False)

AuthSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=auth_engine)
BusinessSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=business_engine)

AuthBase = declarative_base()
BusinessBase = declarative_base()

def get_auth_db():
    db = AuthSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_business_db():
    db = BusinessSessionLocal()
    try:
        yield db
    finally:
        db.close()