from fastapi import FastAPI
from fastapi.responses import JSONResponse
from core.database import auth_engine, AuthBase
from modules.auth.router import router as auth_router

AuthBase.metadata.create_all(bind=auth_engine)

app = FastAPI(
    title="CinemaPlus Backend",
    description="Monolito Modular - Plataforma de Servicios",
    version="1.0.0",
)

app.include_router(auth_router)

@app.get("/health")
async def health_check():
    return JSONResponse(
        status_code=200, 
        content={"status": "ok", "message": "CinemaPlus API está funcionando correctamente."}
    )