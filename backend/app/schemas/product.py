from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class CategoryBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Electronics"})
    description: Optional[str] = Field(None, json_schema_extra={"example": "Gadgets, devices, and accessories"})

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    title: str = Field(..., json_schema_extra={"example": "Wireless Noise-Cancelling Headphones"})
    description: str = Field(..., json_schema_extra={"example": "Premium over-ear headphones with 30-hour battery life"})
    price: float = Field(..., gt=0, json_schema_extra={"example": 2999.0})
    stock_quantity: int = Field(..., ge=0, json_schema_extra={"example": 50})
    image_url: Optional[str] = Field(None, json_schema_extra={"example": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"})
    category_id: int = Field(..., json_schema_extra={"example": 1})

class ProductCreate(ProductBase):
    pass

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
    model_config = ConfigDict(from_attributes=True)

class ProductListResponse(BaseModel):
    total: int
    page: int
    limit: int
    products: List[ProductResponse]