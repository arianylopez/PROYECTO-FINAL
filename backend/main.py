from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(
    title="CinemaPlus Backend",
    description="Monolito Modular - Plataforma de Servicios",
    version="1.0.0",
)

@app.get("/health")
async def health_check():
    return JSONResponse(
        status_code=200, 
        content={"status": "ok", "message": "CinemaPlus API está funcionando correctamente."}
    )