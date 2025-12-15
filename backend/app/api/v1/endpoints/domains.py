"""
Domain management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.exceptions import ValidationException, NotFoundException
from app.models.user import User
from app.models.domain import Domain
from app.schemas.domain import DomainCreate, DomainResponse, DomainUpdate, DomainVerification
from app.services.domain_service import DomainService

router = APIRouter()


@router.get("/", response_model=dict)
async def get_domains(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách domains của user
    """
    try:
        query = select(Domain).where(Domain.user_id == current_user.id)
        
        # Filter by search
        if search:
            query = query.where(
                or_(
                    Domain.url.ilike(f"%{search}%"),
                    Domain.description.ilike(f"%{search}%")
                )
            )
        
        # Filter by status
        if status and status != "all":
            query = query.where(Domain.status == status)
        
        # Order by created_at desc
        query = query.order_by(Domain.created_at.desc())
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        domains = result.scalars().all()
        
        # Get total count
        count_query = select(Domain).where(Domain.user_id == current_user.id)
        if search:
            count_query = count_query.where(
                or_(
                    Domain.url.ilike(f"%{search}%"),
                    Domain.description.ilike(f"%{search}%")
                )
            )
        if status and status != "all":
            count_query = count_query.where(Domain.status == status)
            
        count_result = await db.execute(count_query)
        total = len(count_result.scalars().all())
        
        return {
            "success": True,
            "data": [DomainResponse.from_orm(domain) for domain in domains],
            "pagination": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "has_more": skip + limit < total
            }
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.post("/", response_model=dict)
async def create_domain(
    domain_data: DomainCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Thêm domain mới
    """
    domain_service = DomainService(db)
    
    try:
        domain = await domain_service.create_domain(current_user.id, domain_data)
        return {
            "success": True,
            "message": "Domain đã được thêm thành công",
            "data": DomainResponse.from_orm(domain)
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.get("/{domain_id}", response_model=dict)
async def get_domain(
    domain_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thông tin chi tiết domain
    """
    try:
        result = await db.execute(
            select(Domain).where(
                and_(
                    Domain.id == domain_id,
                    Domain.user_id == current_user.id
                )
            )
        )
        domain = result.scalar_one_or_none()
        
        if not domain:
            raise NotFoundException("Domain không tồn tại")
        
        return {
            "success": True,
            "data": DomainResponse.from_orm(domain)
        }
    except Exception as e:
        if isinstance(e, NotFoundException):
            raise e
        raise ValidationException(str(e))


@router.put("/{domain_id}", response_model=dict)
async def update_domain(
    domain_id: uuid.UUID,
    domain_data: DomainUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật thông tin domain
    """
    domain_service = DomainService(db)
    
    try:
        domain = await domain_service.update_domain(current_user.id, domain_id, domain_data)
        return {
            "success": True,
            "message": "Domain đã được cập nhật",
            "data": DomainResponse.from_orm(domain)
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.delete("/{domain_id}", response_model=dict)
async def delete_domain(
    domain_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa domain
    """
    domain_service = DomainService(db)
    
    try:
        await domain_service.delete_domain(current_user.id, domain_id)
        return {
            "success": True,
            "message": "Domain đã được xóa"
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.post("/{domain_id}/verify", response_model=dict)
async def verify_domain(
    domain_id: uuid.UUID,
    verification_data: DomainVerification,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xác minh quyền sở hữu domain
    """
    domain_service = DomainService(db)
    
    try:
        result = await domain_service.verify_domain(current_user.id, domain_id, verification_data.method)
        return {
            "success": True,
            "message": "Xác minh thành công" if result else "Xác minh thất bại",
            "data": {"verified": result}
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.get("/{domain_id}/verification-info", response_model=dict)
async def get_verification_info(
    domain_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thông tin xác minh domain
    """
    domain_service = DomainService(db)
    
    try:
        info = await domain_service.get_verification_info(current_user.id, domain_id)
        return {
            "success": True,
            "data": info
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.delete("/bulk-delete", response_model=dict)
async def bulk_delete_domains(
    domain_ids: List[uuid.UUID],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa nhiều domains cùng lúc
    """
    domain_service = DomainService(db)
    
    try:
        deleted_count = await domain_service.bulk_delete_domains(current_user.id, domain_ids)
        return {
            "success": True,
            "message": f"Đã xóa {deleted_count} domains",
            "data": {"deleted_count": deleted_count}
        }
    except Exception as e:
        raise ValidationException(str(e))