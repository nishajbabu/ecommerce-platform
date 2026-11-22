from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserProfileUpdate, UserResponse, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    new_user = User(
        full_name=user_in.full_name.strip(),
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=hash_password(user_in.password),
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Protected route: Returns the profile of whichever user's token was sent."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Protected route: Update full name and up to two mobile numbers."""
    update_data = profile_in.model_dump(exclude_unset=True)

    next_phone = update_data.get("phone", current_user.phone)
    next_secondary = update_data.get("secondary_phone", current_user.secondary_phone)
    if next_phone and next_secondary and next_phone == next_secondary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Secondary mobile number must be different from primary mobile number"
        )

    for field, value in update_data.items():
        if field == "full_name" and value is not None:
            setattr(current_user, field, value.strip())
        else:
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user