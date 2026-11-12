import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuraShop E-Commerce API"
    VERSION: str = "1.0.0"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ecommerce.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-123456")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    model_config = ConfigDict(case_sensitive=True)

settings = Settings()