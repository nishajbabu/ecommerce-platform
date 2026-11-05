from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.order import CartItem, Order, OrderItem
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/api/orders", tags=["Orders & Checkout"])

# ====================================================
# CUSTOMER ORDER FLOW
# ====================================================

@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Checkout flow:
    1. Reads user's cart items
    2. Validates stock availability
    3. Deducts stock from inventory
    4. Creates Order and OrderItems (snapshotting prices)
    5. Clears the cart
    All executed within an atomic database transaction.
    """
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Your cart is empty")

    total_amount = 0.0

    # 1. Stock check
    for item in cart_items:
        if not item.product.is_active:
            raise HTTPException(status_code=400, detail=f"Product '{item.product.title}' is no longer available.")
        if item.product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough stock for '{item.product.title}'. Only {item.product.stock_quantity} left."
            )
        total_amount += item.product.price * item.quantity

    try:
        # 2. Create the Order
        new_order = Order(
            user_id=current_user.id,
            total_amount=round(total_amount, 2),
            shipping_address=order_in.shipping_address,
            status="pending"
        )
        db.add(new_order)
        db.flush()  # Generates new_order.id before committing

        # 3. Create OrderItems & Deduct Stock
        for item in cart_items:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product.id,
                quantity=item.quantity,
                price_at_purchase=item.product.price  # Locked price snapshot
            )
            db.add(order_item)

            # Deduct stock
            item.product.stock_quantity -= item.quantity

        # 4. Clear the user's cart
        db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()

        # Commit entire transaction
        db.commit()
        db.refresh(new_order)
        return new_order

    except Exception as e:
        db.rollback()  # Roll back if anything fails
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")

@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Customer: View own order history."""
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Customer or Admin: View individual order details."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Regular customers can only view their own orders
    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot view another customer's order")

    return order


# ====================================================
# ADMIN ORDER MANAGEMENT
# ====================================================

@router.get("", response_model=List[OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, processing, shipped, delivered, cancelled"),
    admin: User = Depends(get_current_admin)  # Admin check
):
    """Admin-only: View all customer orders with optional status filter."""
    query = db.query(Order).order_by(Order.created_at.desc())
    if status_filter:
        query = query.filter(Order.status == status_filter)
    return query.all()

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)  # Admin check
):
    """Admin-only: Update order status (pending, processing, shipped, delivered, cancelled)."""
    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if status_in.status.lower() not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status_in.status.lower()
    db.commit()
    db.refresh(order)
    return order