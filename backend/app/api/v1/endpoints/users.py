"""
User management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.exceptions import ValidationException
from app.models.user import User, Subscription
from app.schemas.user import UserResponse, UserUpdate, SubscriptionResponse

router = APIRouter()


@router.get("/me", response_model=dict)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Lấy thông tin user hiện tại
    """
    return {
        "success": True,
        "data": UserResponse.from_orm(current_user)
    }


@router.put("/me", response_model=dict)
async def update_current_user(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Cập nhật thông tin user hiện tại
    """
    try:
        # Update user fields
        if user_data.full_name is not None:
            current_user.full_name = user_data.full_name
        if user_data.company is not None:
            current_user.company = user_data.company
        if user_data.phone is not None:
            current_user.phone = user_data.phone
        if user_data.timezone is not None:
            current_user.timezone = user_data.timezone
        
        await db.commit()
        await db.refresh(current_user)
        
        return {
            "success": True,
            "message": "Thông tin đã được cập nhật",
            "data": UserResponse.from_orm(current_user)
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.get("/subscription", response_model=dict)
async def get_user_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Lấy thông tin subscription của user
    """
    try:
        result = await db.execute(
            select(Subscription).where(Subscription.user_id == current_user.id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            raise ValidationException("Không tìm thấy thông tin subscription")
        
        return {
            "success": True,
            "data": SubscriptionResponse.from_orm(subscription)
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.delete("/me", response_model=dict)
async def delete_current_user(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Xóa tài khoản user hiện tại
    """
    try:
        await db.delete(current_user)
        await db.commit()
        
        return {
            "success": True,
            "message": "Tài khoản đã được xóa"
        }
    except Exception as e:
        raise ValidationException(str(e))