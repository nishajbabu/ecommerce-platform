from pydantic import BaseModel, ConfigDict
from typing import List
from app.schemas.product import ProductResponse
from app.schemas.order import OrderResponse

class LowStockAlert(BaseModel):
    product_id: int
    title: str
    stock_quantity: int
    price: float
    model_config = ConfigDict(from_attributes=True)

class AdminDashboardAnalytics(BaseModel):
    total_revenue: float
    total_orders: int
    total_customers: int
    total_products: int
    low_stock_alerts: List[LowStockAlert]
    recent_orders: List[OrderResponse]