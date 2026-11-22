from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user import User, UserAddress
from app.models.product import ProductReview
from app.schemas.user import AddressCreate, AddressUpdate, AddressResponse
from app.schemas.product import ReviewResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api", tags=["User Settings"])


@router.get("/addresses", response_model=List[AddressResponse])
def list_my_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(UserAddress)
        .filter(UserAddress.user_id == current_user.id)
        .order_by(UserAddress.is_default.desc(), UserAddress.created_at.desc())
        .all()
    )


@router.post("/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def create_address(
    addr_in: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_count = db.query(UserAddress).filter(UserAddress.user_id == current_user.id).count()
    should_be_default = addr_in.is_default or existing_count == 0

    if should_be_default:
        db.query(UserAddress).filter(UserAddress.user_id == current_user.id).update({"is_default": False})

    new_addr = UserAddress(
        user_id=current_user.id,
        label=addr_in.label,
        recipient_name=addr_in.recipient_name,
        phone=addr_in.phone,
        address_line=addr_in.address_line,
        city=addr_in.city,
        state=addr_in.state,
        postal_code=addr_in.postal_code,
        is_default=should_be_default,
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return new_addr


@router.put("/addresses/{address_id}", response_model=AddressResponse)
def update_address(
    address_id: int,
    addr_in: AddressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    addr = (
        db.query(UserAddress)
        .filter(UserAddress.id == address_id, UserAddress.user_id == current_user.id)
        .first()
    )
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    update_data = addr_in.model_dump(exclude_unset=True)
    if update_data.get("is_default"):
        db.query(UserAddress).filter(UserAddress.user_id == current_user.id).update({"is_default": False})

    for field, value in update_data.items():
        setattr(addr, field, value)

    db.commit()
    db.refresh(addr)
    return addr


@router.delete("/addresses/{address_id}", status_code=status.HTTP_200_OK)
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    addr = (
        db.query(UserAddress)
        .filter(UserAddress.id == address_id, UserAddress.user_id == current_user.id)
        .first()
    )
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    was_default = addr.is_default
    db.delete(addr)
    db.commit()

    if was_default:
        next_addr = (
            db.query(UserAddress)
            .filter(UserAddress.user_id == current_user.id)
            .first()
        )
        if next_addr:
            next_addr.is_default = True
            db.commit()

    return {"message": "Address deleted"}


@router.get("/reviews/my-reviews", response_model=List[ReviewResponse])
def list_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(ProductReview)
        .filter(ProductReview.user_id == current_user.id)
        .order_by(ProductReview.created_at.desc())
        .all()
    )


@router.delete("/reviews/{review_id}", status_code=status.HTTP_200_OK)
def delete_my_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = (
        db.query(ProductReview)
        .filter(ProductReview.id == review_id, ProductReview.user_id == current_user.id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    db.delete(review)
    db.commit()
    return {"message": "Review deleted"}