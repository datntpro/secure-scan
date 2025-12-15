"""
Authentication endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.core.database import get_db
from app.core.exceptions import InvalidCredentialsException, ValidationException
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.services.auth_service import AuthService

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=dict)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Đăng ký người dùng mới
    """
    auth_service = AuthService(db)
    
    try:
        user = await auth_service.register_user(user_data)
        return {
            "success": True,
            "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận.",
            "data": {
                "user_id": str(user.id),
                "email": user.email
            }
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.post("/login", response_model=dict)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Đăng nhập người dùng
    """
    auth_service = AuthService(db)
    
    try:
        token_data = await auth_service.authenticate_user(credentials)
        return {
            "success": True,
            "data": token_data
        }
    except Exception as e:
        raise InvalidCredentialsException()


@router.post("/refresh", response_model=dict)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Làm mới access token
    """
    auth_service = AuthService(db)
    
    try:
        token_data = await auth_service.refresh_access_token(refresh_token)
        return {
            "success": True,
            "data": token_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/verify-email")
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Xác nhận email
    """
    auth_service = AuthService(db)
    
    try:
        await auth_service.verify_email(token)
        return {
            "success": True,
            "message": "Email đã được xác nhận thành công"
        }
    except Exception as e:
        raise ValidationException("Token xác nhận không hợp lệ hoặc đã hết hạn")


@router.post("/forgot-password")
async def forgot_password(
    email: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Quên mật khẩu
    """
    auth_service = AuthService(db)
    
    try:
        await auth_service.send_password_reset(email)
        return {
            "success": True,
            "message": "Link đặt lại mật khẩu đã được gửi đến email của bạn"
        }
    except Exception as e:
        # Always return success for security
        return {
            "success": True,
            "message": "Link đặt lại mật khẩu đã được gửi đến email của bạn"
        }


@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Đặt lại mật khẩu
    """
    auth_service = AuthService(db)
    
    try:
        await auth_service.reset_password(token, new_password)
        return {
            "success": True,
            "message": "Mật khẩu đã được cập nhật thành công"
        }
    except Exception as e:
        raise ValidationException("Token không hợp lệ hoặc đã hết hạn")


@router.post("/resend-verification")
async def resend_verification(
    email: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Gửi lại email xác nhận
    """
    # TODO: Implement resend verification
    return {
        "success": True,
        "message": "Email xác nhận đã được gửi lại"
    }


@router.post("/validate-reset-token")
async def validate_reset_token(
    token: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Xác thực token đặt lại mật khẩu
    """
    # TODO: Implement token validation
    return {
        "success": True,
        "message": "Token hợp lệ"
    }