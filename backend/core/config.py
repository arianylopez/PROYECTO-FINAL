from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    DB_HOST: str
    DB_PORT: int
    ENVIRONMENT: str
    SECRET_KEY: str
    ALGORITHM: str
    GOOGLE_CLIENT_ID: str = "" 
    
    MONGO_URL: str = "mongodb://mongodb:27017"
    MONGO_DB: str = "cinemaplus_ugc"
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:29092"

    class Config:
        env_file = "../.env" 

settings = Settings()