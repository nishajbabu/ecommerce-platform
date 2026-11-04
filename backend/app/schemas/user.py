from pydantic import BaseModel, EmailStr
from datetime import datetime

# 1. When a user registers (Incoming)
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "customer"  # Can optionally be 'admin' during setup

# 2. When a user logs in (Incoming)
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# 3. What the frontend receives (Outgoing - Notice NO password here!)
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy model objects

# 4. Token response after successful login
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse