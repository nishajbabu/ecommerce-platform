import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuraShop E-Commerce API"
    VERSION: str = "1.0.0"
    
    # Read DATABASE_URL and normalize postgres:// to postgresql:// if needed
    raw_db_url: str = os.getenv("DATABASE_URL", "sqlite:///./ecommerce.db")
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
        
    DATABASE_URL: str = raw_db_url
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-123456")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    model_config = ConfigDict(case_sensitive=True)

settings = Settings()