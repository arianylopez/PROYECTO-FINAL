from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    ENVIRONMENT: str
    SECRET_KEY: str
    ALGORITHM: str

    class Config:
        env_file = "../.env" 

settings = Settings()