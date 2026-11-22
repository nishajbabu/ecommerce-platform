import re
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from datetime import datetime
from typing import Optional


def _validate_phone(v: Optional[str]) -> Optional[str]:
    if v is None or v.strip() == "":
        return None
    cleaned = v.strip()
    digits = re.sub(r"\D", "", cleaned)
    if len(digits) < 10 or len(digits) > 15:
        raise ValueError("Mobile number must contain between 10 and 15 digits")
    return cleaned


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=6)
    role: str = "customer"

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: str) -> str:
        validated = _validate_phone(v)
        if not validated:
            raise ValueError("Mobile number is required")
        return validated


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    secondary_phone: Optional[str] = None

    @field_validator("phone", "secondary_phone")
    @classmethod
    def check_optional_phone(cls, v: Optional[str]) -> Optional[str]:
        return _validate_phone(v)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    secondary_phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Shipping Addresses ---

class AddressBase(BaseModel):
    label: str = Field("Home", max_length=50)
    recipient_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    address_line: str = Field(..., min_length=5, max_length=300)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., min_length=4, max_length=20)
    is_default: bool = False

    @field_validator("phone")
    @classmethod
    def check_address_phone(cls, v: str) -> str:
        validated = _validate_phone(v)
        if not validated:
            raise ValueError("Valid contact number is required")
        return validated


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    label: Optional[str] = Field(None, max_length=50)
    recipient_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    address_line: Optional[str] = Field(None, min_length=5, max_length=300)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=4, max_length=20)
    is_default: Optional[bool] = None

    @field_validator("phone")
    @classmethod
    def check_update_phone(cls, v: Optional[str]) -> Optional[str]:
        return _validate_phone(v)


class AddressResponse(AddressBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)