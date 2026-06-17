from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware 
from core.database import auth_engine, AuthBase
from modules.auth.router import router as auth_router
from modules.auth.router import router as auth_router
from modules.catalog.public_router import router as catalog_public_router

AuthBase.metadata.create_all(bind=auth_engine)

app = FastAPI(
    title="CinemaPlus Backend",
    description="Monolito Modular - Plataforma de Servicios"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost", "http://127.0.0.1"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(catalog_public_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return JSONResponse(status_code=200, content={"status": "ok"})