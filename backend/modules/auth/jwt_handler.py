from datetime import datetime, timedelta, timezone
from jose import jwt
from typing import Optional

SECRET_KEY='django-insecure-3@39=6(c-vtr%!)7l$$!9-*@mq^*kb0&x#*d@@_qa*#y9@a=j('
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)