from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.order import CartItem
from app.schemas.order import CartItemCreate, CartItemUpdate, CartResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/cart", tags=["Shopping Cart"])

@router.get("", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current customer's active cart with subtotal calculation."""
    items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    
    subtotal = sum(item.product.price * item.quantity for item in items if item.product.is_active)
    total_items = sum(item.quantity for item in items)
    
    return {
        "items": items,
        "total_items": total_items,
        "subtotal": round(subtotal, 2)
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def add_to_cart(
    item_in: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add an item to the shopping cart or increment quantity if it's already there."""
    product = db.query(Product).filter(Product.id == item_in.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.stock_quantity < item_in.quantity:
        raise HTTPException(status_code=400, detail=f"Only {product.stock_quantity} units available in stock")

    cart_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == item_in.product_id
    ).first()

    if cart_item:
        # Check stock against total desired quantity
        if product.stock_quantity < (cart_item.quantity + item_in.quantity):
            raise HTTPException(status_code=400, detail=f"Cannot add more. Only {product.stock_quantity} in stock.")
        cart_item.quantity += item_in.quantity
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity
        )
        db.add(cart_item)

    db.commit()
    return {"message": "Product added to cart successfully"}

@router.put("/{cart_item_id}")
def update_cart_item(
    cart_item_id: int,
    item_update: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update quantity of an item in the cart."""
    cart_item = db.query(CartItem).filter(
        CartItem.id == cart_item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if cart_item.product.stock_quantity < item_update.quantity:
        raise HTTPException(status_code=400, detail=f"Only {cart_item.product.stock_quantity} available in stock")

    cart_item.quantity = item_update.quantity
    db.commit()
    return {"message": "Cart updated successfully"}

@router.delete("/{cart_item_id}")
def remove_from_cart(
    cart_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a single product from the cart."""
    cart_item = db.query(CartItem).filter(
        CartItem.id == cart_item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()
    return {"message": "Item removed from cart"}

@router.delete("")
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear all items from the current user's cart."""
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Cart cleared"}