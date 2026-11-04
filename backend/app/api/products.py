from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List

from app.db.session import get_db
from app.models.product import Product, Category
from app.models.user import User
from app.schemas.product import (
    CategoryCreate, CategoryResponse,
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
)
from app.api.deps import get_current_admin

router = APIRouter(prefix="/api", tags=["Products & Categories"])

# ====================================================
# CATEGORIES ENDPOINTS
# ====================================================

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """Public: List all available categories."""
    return db.query(Category).all()

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)  # Admin check
):
    """Admin-only: Add a new category."""
    existing = db.query(Category).filter(Category.name.ilike(category_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    category = Category(name=category_in.name, description=category_in.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# ====================================================
# PRODUCTS ENDPOINTS (PUBLIC)
# ====================================================

@router.get("/products", response_model=ProductListResponse)
def list_products(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in title or description"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter")
):
    """
    Public: List products with search, category filtering, price filtering, and pagination.
    """
    query = db.query(Product).filter(Product.is_active == True)

    # 1. Search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Product.title.ilike(search_filter),
                Product.description.ilike(search_filter)
            )
        )

    # 2. Category filter
    if category_id:
        query = query.filter(Product.category_id == category_id)

    # 3. Price range filter
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # Total matching count (for frontend pagination UI)
    total = query.count()

    # Pagination: skip and limit
    skip = (page - 1) * limit
    products = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "products": products
    }

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product_details(product_id: int, db: Session = Depends(get_db)):
    """Public: Get individual product details."""
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ====================================================
# PRODUCTS MANAGEMENT ENDPOINTS (ADMIN ONLY)
# ====================================================

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)  # Admin check
):
    """Admin-only: Add a new product to inventory."""
    # Verify category exists
    category = db.query(Category).filter(Category.id == product_in.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    new_product = Product(
        title=product_in.title,
        description=product_in.description,
        price=product_in.price,
        stock_quantity=product_in.stock_quantity,
        image_url=product_in.image_url,
        category_id=product_in.category_id
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)  # Admin check
):
    """Admin-only: Update product information, price, or stock."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # If updating category, check that it exists
    if product_update.category_id is not None:
        category = db.query(Category).filter(Category.id == product_update.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    # Update only fields provided by user
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product

@router.delete("/products/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)  # Admin check
):
    """
    Admin-only: Soft-delete a product (marks is_active = False so past order history remains intact).
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Soft delete
    product.is_active = False
    db.commit()
    return {"message": f"Product '{product.title}' has been successfully deactivated."}