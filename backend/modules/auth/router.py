from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
from datetime import date
import bcrypt  
from uuid import UUID
from core.database import get_auth_db
from modules.auth.models import User
from datetime import datetime, timedelta, timezone
from jose import jwt
from core.config import settings

router = APIRouter(prefix="/auth", tags=["Autenticación"])

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_bytes.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    birth_date: date
    device_fingerprint: str

    @field_validator('birth_date')
    @classmethod
    def validate_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('Debes ser mayor de 18 años para registrarte en CinemaPlus')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        return v

class UserResponse(BaseModel):
    id: UUID  
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
def register_user(request: UserRegisterRequest, db: Session = Depends(get_auth_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Este correo electrónico ya está registrado")

    hashed_password = get_password_hash(request.password)

    new_user = User(
        name=request.name,
        email=request.email,
        password_hash=hashed_password,
        birth_date=request.birth_date
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login")
def login(request: UserRegisterRequest, db: Session = Depends(get_auth_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    expire = datetime.now(timezone.utc) + timedelta(hours=2)
    to_encode = {"sub": str(user.id), "role": user.role, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return {"access_token": encoded_jwt, "token_type": "bearer"}