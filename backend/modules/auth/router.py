from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt, JWTError
from uuid import UUID
import json

from core.database import get_auth_db
from core.config import settings
from modules.auth.models import User, Device

router = APIRouter(prefix="/auth", tags=["Autenticación"])

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_tokens(user: User):
    access_expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    access_token = jwt.encode({"sub": str(user.id), "role": user.role, "exp": access_expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    refresh_expire = datetime.now(timezone.utc) + timedelta(days=7)
    refresh_token = jwt.encode({"sub": str(user.id), "type": "refresh", "exp": refresh_expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return access_token, refresh_token

class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    birth_date: str 
    device_fingerprint: str
    device_name: str = "Navegador Web"

    @field_validator('birth_date')
    @classmethod
    def validate_age(cls, v):
        birth = datetime.strptime(v, "%Y-%m-%d").date()
        today = datetime.today().date()
        age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        if age < 18:
            raise ValueError('Debes ser mayor de 18 años para registrarte en CinemaPlus')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        return v

class LoginRequest(BaseModel):
    email: str
    password: str
    device_fingerprint: str
    device_name: str = "Navegador Web"


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(request: UserRegisterRequest, response: Response, db: Session = Depends(get_auth_db)):
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=409, detail="Este correo electrónico ya está registrado. Ingresa a tu cuenta o recupera tu contraseña.")

    new_user = User(
        name=request.name,
        email=request.email,
        password_hash=get_password_hash(request.password),
        birth_date=datetime.strptime(request.birth_date, "%Y-%m-%d").date()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_device = Device(user_id=new_user.id, device_fingerprint=request.device_fingerprint, device_name=request.device_name)
    db.add(new_device)
    db.commit()

    return {"message": "Usuario creado exitosamente", "redirect": "/onboarding"}

@router.post("/login")
def login(request: LoginRequest, response: Response, db: Session = Depends(get_auth_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    active_devices = db.query(Device).filter(Device.user_id == user.id, Device.is_active == True).all()
    known_device = next((d for d in active_devices if d.device_fingerprint == request.device_fingerprint), None)

    if not known_device and len(active_devices) >= 3:
        devices_list = [{"id": str(d.id), "name": d.device_name, "last_seen": d.last_seen.isoformat()} for d in active_devices]
        return Response(status_code=403, content=json.dumps({"detail": "Límite de dispositivos alcanzado (3/3)", "devices": devices_list}))

    if not known_device:
        known_device = Device(user_id=user.id, device_fingerprint=request.device_fingerprint, device_name=request.device_name)
        db.add(known_device)
    else:
        known_device.last_seen = datetime.now(timezone.utc)
    db.commit()

    access_token, refresh_token = create_tokens(user)
    
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, max_age=7*24*60*60, samesite="lax")
    
    return {
        "access_token": access_token, 
        "user": {"id": str(user.id), "name": user.name, "email": user.email, "role": user.role}
    }

@router.post("/devices/{device_id}/revoke")
def revoke_device(device_id: UUID, db: Session = Depends(get_auth_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device:
        device.is_active = False
        db.commit()
    return {"message": "Dispositivo revocado"}

@router.post("/refresh")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_auth_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user = db.query(User).filter(User.id == payload.get("sub")).first()
        access_token, new_refresh_token = create_tokens(user)
        response.set_cookie(key="refresh_token", value=new_refresh_token, httponly=True, max_age=7*24*60*60, samesite="lax")
        return {"access_token": access_token}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Cierre de sesión exitoso"}