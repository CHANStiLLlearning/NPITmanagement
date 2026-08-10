import os
from pydantic_settings import BaseSettings

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
default_db_path = os.path.join(base_dir, "school.db").replace("\\", "/")
default_sqlite_url = f"sqlite:///{default_db_path}"

raw_db_url = os.getenv("DATABASE_URL", default_sqlite_url)
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
