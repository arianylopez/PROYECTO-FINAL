import uuid
from sqlalchemy import Column, String, Date, Boolean, DateTime, ARRAY, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from core.database import AuthBase

class User(AuthBase):
    __tablename__ = "auth_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    birth_date = Column(Date, nullable=False) 
    role = Column(String, default="user", nullable=False)
    is_verified = Column(Boolean, default=False)
    genre_preferences = Column(ARRAY(Integer), default=[])
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Device(AuthBase):
    __tablename__ = "auth_devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False) 
    device_fingerprint = Column(String, nullable=False)
    device_name = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))