from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ================= CATEGORY SCHEMAS =================
class CategoryBase(BaseModel):
    name: str = Field(..., example="Electronics")
    description: Optional[str] = Field(None, example="Gadgets, devices, and accessories")

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True


# ================= PRODUCT SCHEMAS =================
class ProductBase(BaseModel):
    title: str = Field(..., example="Wireless Noise-Cancelling Headphones")
    description: str = Field(..., example="Premium over-ear headphones with 30-hour battery life")
    price: float = Field(..., gt=0, example=2999.0)
    stock_quantity: int = Field(..., ge=0, example=50)
    image_url: Optional[str] = Field(None, example="https://images.unsplash.com/photo-1505740420928-5e560c06d30e")
    category_id: int = Field(..., example=1)

class ProductCreate(ProductBase):
    pass

# When updating, all fields are optional (you can update just the price or just the stock)
class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

# Paginated list response
class ProductListResponse(BaseModel):
    total: int
    page: int
    limit: int
    products: List[ProductResponse]