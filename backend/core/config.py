from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    ENVIRONMENT: str
    SECRET_KEY: str
    ALGORITHM: str
    GOOGLE_CLIENT_ID: str = "" 

    class Config:
        env_file = "../.env" 

settings = Settings()