"""
Authentication service
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import secrets
import uuid

from app.models.user import User, Subscription, SubscriptionPlan, SubscriptionStatus
from app.schemas.auth import UserRegister, UserLogin
from app.core.config import settings, SUBSCRIPTION_PLANS
from app.core.exceptions import InvalidCredentialsException, ValidationException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Authentication service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def register_user(self, user_data: UserRegister) -> User:
        """Register new user"""
        
        # Check if email already exists
        result = await self.db.execute(
            select(User).where(User.email == user_data.email)
        )
        if result.scalar_one_or_none():
            raise ValidationException("Email này đã được sử dụng")
        
        # Hash password
        password_hash = pwd_context.hash(user_data.password)
        
        # Create user
        user = User(
            email=user_data.email,
            password_hash=password_hash,
            full_name=user_data.full_name,
            company=user_data.company,
            email_verification_token=secrets.token_urlsafe(32)
        )
        
        self.db.add(user)
        await self.db.flush()
        
        # Create free subscription
        free_plan = SUBSCRIPTION_PLANS["free"]
        subscription = Subscription(
            user_id=user.id,
            plan=SubscriptionPlan.FREE,
            status=SubscriptionStatus.ACTIVE,
            scans_limit=free_plan["scans_per_month"]
        )
        
        self.db.add(subscription)
        await self.db.commit()
        
        # TODO: Send verification email
        
        return user
    
    async def authenticate_user(self, credentials: UserLogin) -> dict:
        """Authenticate user and return tokens"""
        
        # Get user
        result = await self.db.execute(
            select(User).where(User.email == credentials.email)
        )
        user = result.scalar_one_or_none()
        
        if not user or not pwd_context.verify(credentials.password, user.password_hash):
            raise InvalidCredentialsException()
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        await self.db.commit()
        
        # Generate tokens
        access_token = self._create_access_token(user.id)
        refresh_token = self._create_refresh_token(user.id)
        
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": settings.JWT_EXPIRE_MINUTES * 60,
            "refresh_token": refresh_token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "email_verified": user.email_verified
            }
        }
    
    async def refresh_access_token(self, refresh_token: str) -> dict:
        """Refresh access token"""
        try:
            payload = jwt.decode(
                refresh_token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id = payload.get("sub")
            if not user_id:
                raise JWTError()
        except JWTError:
            raise InvalidCredentialsException("Invalid refresh token")
        
        # Get user
        result = await self.db.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        user = result.scalar_one_or_none()
        if not user:
            raise InvalidCredentialsException("User not found")
        
        # Generate new tokens
        access_token = self._create_access_token(user.id)
        new_refresh_token = self._create_refresh_token(user.id)
        
        return {
            "access_token": access_token,
            "token_type": "Bearer", 
            "expires_in": settings.JWT_EXPIRE_MINUTES * 60,
            "refresh_token": new_refresh_token
        }
    
    async def verify_email(self, token: str):
        """Verify email with token"""
        result = await self.db.execute(
            select(User).where(User.email_verification_token == token)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise ValidationException("Invalid verification token")
        
        user.email_verified = True
        user.email_verified_at = datetime.utcnow()
        user.email_verification_token = None
        
        await self.db.commit()
    
    async def send_password_reset(self, email: str):
        """Send password reset email"""
        # TODO: Implement password reset email
        pass
    
    async def reset_password(self, token: str, new_password: str):
        """Reset password with token"""
        # TODO: Implement password reset
        pass
    
    def _create_access_token(self, user_id: uuid.UUID) -> str:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "type": "access"
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    def _create_refresh_token(self, user_id: uuid.UUID) -> str:
        """Create JWT refresh token"""
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "type": "refresh"
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)