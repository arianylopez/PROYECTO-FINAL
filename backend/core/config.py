from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    DB_HOST: str
    DB_PORT: int
    
    ENVIRONMENT: str
    FRONTEND_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    GOOGLE_CLIENT_ID: str = ""
    CORS_ALLOWED_ORIGINS: str = "http://localhost,http://localhost:5173"
    
    REDIS_HOST: str
    REDIS_PORT: int
    MONGO_URL: str
    MONGO_DB: str
    KAFKA_BOOTSTRAP_SERVERS: str

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore" 
    )

settings = Settings()