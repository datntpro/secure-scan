"""
Authentication schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    """User registration schema"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Mật khẩu ít nhất 8 ký tự")
    full_name: str = Field(..., min_length=2, max_length=100)
    company: Optional[str] = Field(None, max_length=100)


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    refresh_token: str


class UserResponse(BaseModel):
    """User response schema"""
    id: str
    email: str
    full_name: str
    company: Optional[str]
    role: str
    email_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True