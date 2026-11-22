from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.core.config import settings
from app.db.session import engine, Base
import app.models

from app.api.auth import router as auth_router
from app.api.products import router as products_router
from app.api.cart import router as cart_router
from app.api.orders import router as orders_router
from app.api.admin import router as admin_router
from app.api.ai import router as ai_router
from app.api.profile import router as profile_router


def run_safe_migrations():
    """Safely adds new columns on existing SQLite/PostgreSQL tables without data loss."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        if "users" in existing_tables:
            user_cols = {c["name"] for c in inspector.get_columns("users")}
            if "phone" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(20)"))
            if "secondary_phone" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN secondary_phone VARCHAR(20)"))

        if "products" in existing_tables and engine.dialect.name == "postgresql":
            conn.execute(text("ALTER TABLE products ALTER COLUMN image_url TYPE TEXT"))


Base.metadata.create_all(bind=engine)
run_safe_migrations()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-Stack E-Commerce API with Admin & Customer Support"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(admin_router)
app.include_router(ai_router)
app.include_router(profile_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to NeuraShop API",
        "docs_url": "/docs",
        "status": "active"
    }