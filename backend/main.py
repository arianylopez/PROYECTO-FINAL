from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware 
from contextlib import asynccontextmanager

from core.database import auth_engine, AuthBase
from modules.auth.router import router as auth_router
from modules.catalog.public_router import router as catalog_public_router
from modules.ugc.router import router as ugc_router 
from modules.recommendations.router import router as recs_router

from core.mongo_db import db as mongo_db_client
from motor.motor_asyncio import AsyncIOMotorClient
from confluent_kafka import Producer
from core.config import settings

kafka_producer = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    mongo_db_client.client = AsyncIOMotorClient(settings.MONGO_URL)
    
    global kafka_producer
    try:
        kafka_producer = Producer({'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS})
        print("Kafka Producer conectado exitosamente.")
    except Exception as e:
        print(f"Advertencia: Kafka no está listo. {e}")
        
    yield 
    
    mongo_db_client.client.close()
    if kafka_producer:
        kafka_producer.flush() 

AuthBase.metadata.create_all(bind=auth_engine)

app = FastAPI(
    title="CinemaPlus Backend",
    description="Monolito Modular - Plataforma de Servicios",
    lifespan=lifespan 
)

origins = settings.CORS_ALLOWED_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # <-- Lista dinámica inyectada desde el entorno
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router) 
app.include_router(catalog_public_router, prefix="/api/v1")
app.include_router(ugc_router, prefix="/api/v1")
app.include_router(recs_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return JSONResponse(status_code=200, content={"status": "ok"})