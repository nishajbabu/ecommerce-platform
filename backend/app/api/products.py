from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List

from app.db.session import get_db
from app.models.product import Product, Category, ProductImage, ProductReview
from app.models.user import User
from app.schemas.product import (
    CategoryCreate, CategoryResponse,
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    ReviewCreate, ReviewResponse,
)
from app.api.deps import get_current_admin, get_current_user

router = APIRouter(prefix="/api", tags=["Products & Categories"])


def _sync_product_images(db: Session, product: Product, images: Optional[List[str]], fallback_url: Optional[str]):
    if images is not None:
        cleaned = [img.strip() for img in images if img and img.strip()]
        db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()
        for idx, url in enumerate(cleaned):
            db.add(ProductImage(product_id=product.id, image_url=url, display_order=idx))
        product.image_url = cleaned[0] if cleaned else None
    elif fallback_url is not None:
        cleaned_url = fallback_url.strip() or None
        product.image_url = cleaned_url
        existing_imgs = db.query(ProductImage).filter(ProductImage.product_id == product.id).all()
        if not existing_imgs and cleaned_url:
            db.add(ProductImage(product_id=product.id, image_url=cleaned_url, display_order=0))


# ====================================================
# CATEGORIES ENDPOINTS
# ====================================================

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    existing = db.query(Category).filter(Category.name.ilike(category_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    category = Category(name=category_in.name, description=category_in.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_200_OK)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    active_count = (
        db.query(Product)
        .filter(Product.category_id == category_id, Product.is_active == True)
        .count()
    )
    if active_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete '{category.name}': {active_count} active product(s) still belong to it."
        )

    any_product = db.query(Product).filter(Product.category_id == category_id).first()
    if any_product:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete '{category.name}' because deactivated products still reference it for order history."
        )

    category_name = category.name
    db.delete(category)
    db.commit()
    return {"message": f"Category '{category_name}' has been deleted."}


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
    query = db.query(Product).filter(Product.is_active == True)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Product.title.ilike(search_filter),
                Product.description.ilike(search_filter)
            )
        )

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    total = query.count()
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
    admin: User = Depends(get_current_admin)
):
    category = db.query(Category).filter(Category.id == product_in.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    primary_url = (
        product_in.images[0].strip()
        if product_in.images and len(product_in.images) > 0
        else product_in.image_url
    )

    new_product = Product(
        title=product_in.title,
        description=product_in.description,
        price=product_in.price,
        stock_quantity=product_in.stock_quantity,
        image_url=primary_url,
        category_id=product_in.category_id
    )
    db.add(new_product)
    db.flush()

    _sync_product_images(db, new_product, product_in.images, product_in.image_url)

    db.commit()
    db.refresh(new_product)
    return new_product


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product_update.category_id is not None:
        category = db.query(Category).filter(Category.id == product_update.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    update_data = product_update.model_dump(exclude_unset=True)
    images_payload = update_data.pop("images", None)
    image_url_payload = update_data.pop("image_url", None)

    for field, value in update_data.items():
        setattr(product, field, value)

    _sync_product_images(db, product, images_payload, image_url_payload)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = False
    db.commit()
    return {"message": f"Product '{product.title}' has been successfully deactivated."}


# ====================================================
# PRODUCT RATINGS & REVIEWS
# ====================================================

@router.get("/products/{product_id}/reviews", response_model=List[ReviewResponse])
def list_product_reviews(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return (
        db.query(ProductReview)
        .filter(ProductReview.product_id == product_id)
        .order_by(ProductReview.created_at.desc())
        .all()
    )


@router.post("/products/{product_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_product_review(
    product_id: int,
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update existing review by same user or create new
    existing = (
        db.query(ProductReview)
        .filter(ProductReview.product_id == product_id, ProductReview.user_id == current_user.id)
        .first()
    )
    if existing:
        existing.rating = review_in.rating
        existing.title = review_in.title
        existing.comment = review_in.comment
        db.commit()
        db.refresh(existing)
        return existing

    new_review = ProductReview(
        product_id=product_id,
        user_id=current_user.id,
        rating=review_in.rating,
        title=review_in.title,
        comment=review_in.comment,
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review