import re
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = r"^[\w\.\+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$"

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_\-\.]+$")
    email: str = Field(..., min_length=5, max_length=120, pattern=EMAIL_REGEX)
    role: UserRole = UserRole.EMPLOYEE
    employee_name: Optional[str] = None
    is_active: bool = True

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_\-\.]+$")
    email: str = Field(..., min_length=5, max_length=120, pattern=EMAIL_REGEX)
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.EMPLOYEE
    employee_name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    employee_name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: UserRole
    employee_name: Optional[str] = None
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    identifier: str = Field(..., min_length=1, description="Username or email address")
    password: str = Field(..., min_length=1, description="User secret password")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
