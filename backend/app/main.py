from fastapi import FastAPI
from app.core.config import settings
from app.db.session import engine, Base
import app.models  # Registers all models
from app.api.auth import router as auth_router

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-Stack E-Commerce API with Admin & Customer Support"
)

# Connect Authentication Endpoints
app.include_router(auth_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to NeuraShop API",
        "docs_url": "/docs",
        "status": "active"
    }