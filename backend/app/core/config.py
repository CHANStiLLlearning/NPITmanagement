import os
from pydantic_settings import BaseSettings

raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./school.db")
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

class Settings(BaseSettings):
    PROJECT_NAME: str = "School Management System"
    DATABASE_URL: str = raw_db_url
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        case_sensitive = True

settings = Settings()
