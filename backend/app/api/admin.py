from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.schemas.admin import AdminDashboardAnalytics
from app.schemas.user import UserResponse
from app.api.deps import get_current_admin
from typing import List

router = APIRouter(prefix="/api/admin", tags=["Admin Analytics & Management"])

@router.get("/analytics", response_model=AdminDashboardAnalytics)
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)  # Admin check
):
    """
    Admin-only: Aggregate business intelligence:
    - Total revenue (excluding cancelled orders)
    - Total order count
    - Total registered customers
    - Total products
    - Low-stock alerts (stock < 5)
    - 5 most recent orders
    """
    # 1. Total Revenue (exclude cancelled)
    revenue_result = db.query(func.sum(Order.total_amount))\
        .filter(Order.status != "cancelled")\
        .scalar()
    total_revenue = round(revenue_result or 0.0, 2)

    # 2. Total Orders
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    # 3. Total Customers (role == 'customer')
    total_customers = db.query(func.count(User.id))\
        .filter(User.role == "customer")\
        .scalar() or 0

    # 4. Total Products
    total_products = db.query(func.count(Product.id))\
        .filter(Product.is_active == True)\
        .scalar() or 0

    # 5. Low-stock products (threshold < 5)
    low_stock_products = db.query(Product)\
        .filter(Product.is_active == True, Product.stock_quantity < 5)\
        .all()
    
    low_stock_alerts = [
        {
            "product_id": p.id,
            "title": p.title,
            "stock_quantity": p.stock_quantity,
            "price": p.price
        }
        for p in low_stock_products
    ]

    # 6. Top 5 Recent Orders
    recent_orders = db.query(Order)\
        .order_by(Order.created_at.desc())\
        .limit(5)\
        .all()

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_products": total_products,
        "low_stock_alerts": low_stock_alerts,
        "recent_orders": recent_orders
    }

@router.get("/customers", response_model=List[UserResponse])
def get_all_customers(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin-only: View list of all registered customers."""
    return db.query(User).filter(User.role == "customer").order_by(User.created_at.desc()).all()