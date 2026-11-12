from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.schemas.product import ProductResponse

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(1, gt=0, description="Quantity must be at least 1")

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0, description="Updated quantity")

class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductResponse
    model_config = ConfigDict(from_attributes=True)

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total_items: int
    subtotal: float

class OrderCreate(BaseModel):
    shipping_address: str = Field(..., min_length=10, json_schema_extra={"example": "123 Anna Salai, Chennai, TN - 600002"})

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: float
    product: ProductResponse
    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    shipping_address: str
    created_at: datetime
    items: List[OrderItemResponse]
    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "shipped"}, description="pending, processing, shipped, delivered, or cancelled")