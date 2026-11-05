from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.schemas.product import ProductResponse

# ================= CART SCHEMAS =================
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

    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total_items: int
    subtotal: float


# ================= ORDER SCHEMAS =================
class OrderCreate(BaseModel):
    shipping_address: str = Field(..., min_length=10, example="123 Anna Salai, Chennai, TN - 600002")

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: float
    product: ProductResponse

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    shipping_address: str
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., example="shipped", description="pending, processing, shipped, delivered, or cancelled")