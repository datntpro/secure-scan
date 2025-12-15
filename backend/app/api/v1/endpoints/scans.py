"""
Scan management endpoints
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
from app.models.scan import Scan
from app.models.domain import Domain
from app.schemas.scan import ScanCreate, ScanResponse, BulkScanCreate
from app.services.scan_service import ScanService

router = APIRouter()


@router.get("/", response_model=dict)
async def get_scans(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    domain_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách scans của user
    """
    try:
        query = select(Scan).where(Scan.user_id == current_user.id)
        
        # Filter by domain
        if domain_id:
            query = query.where(Scan.domain_id == domain_id)
        
        # Filter by status
        if status and status != "all":
            query = query.where(Scan.status == status)
        
        # Order by created_at desc
        query = query.order_by(Scan.created_at.desc())
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        scans = result.scalars().all()
        
        # Get total count
        count_query = select(Scan).where(Scan.user_id == current_user.id)
        if domain_id:
            count_query = count_query.where(Scan.domain_id == domain_id)
        if status and status != "all":
            count_query = count_query.where(Scan.status == status)
            
        count_result = await db.execute(count_query)
        total = len(count_result.scalars().all())
        
        return {
            "success": True,
            "data": [ScanResponse.from_orm(scan) for scan in scans],
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
async def create_scan(
    scan_data: ScanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo scan mới
    """
    scan_service = ScanService(db)
    
    try:
        scan = await scan_service.create_scan(current_user.id, scan_data)
        return {
            "success": True,
            "message": "Scan đã được tạo và bắt đầu",
            "data": ScanResponse.from_orm(scan)
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.post("/bulk", response_model=dict)
async def create_bulk_scans(
    bulk_scan_data: BulkScanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo nhiều scans cùng lúc
    """
    scan_service = ScanService(db)
    
    try:
        scans = await scan_service.create_bulk_scans(current_user.id, bulk_scan_data)
        return {
            "success": True,
            "message": f"Đã tạo {len(scans)} scans",
            "data": [ScanResponse.from_orm(scan) for scan in scans]
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.get("/{scan_id}", response_model=dict)
async def get_scan(
    scan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thông tin chi tiết scan
    """
    try:
        result = await db.execute(
            select(Scan).where(
                and_(
                    Scan.id == scan_id,
                    Scan.user_id == current_user.id
                )
            )
        )
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise NotFoundException("Scan không tồn tại")
        
        return {
            "success": True,
            "data": ScanResponse.from_orm(scan)
        }
    except Exception as e:
        if isinstance(e, NotFoundException):
            raise e
        raise ValidationException(str(e))


@router.delete("/{scan_id}", response_model=dict)
async def delete_scan(
    scan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa scan
    """
    scan_service = ScanService(db)
    
    try:
        await scan_service.delete_scan(current_user.id, scan_id)
        return {
            "success": True,
            "message": "Scan đã được xóa"
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.post("/{scan_id}/stop", response_model=dict)
async def stop_scan(
    scan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Dừng scan đang chạy
    """
    scan_service = ScanService(db)
    
    try:
        scan = await scan_service.stop_scan(current_user.id, scan_id)
        return {
            "success": True,
            "message": "Scan đã được dừng",
            "data": ScanResponse.from_orm(scan)
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.get("/{scan_id}/results", response_model=dict)
async def get_scan_results(
    scan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy kết quả scan
    """
    scan_service = ScanService(db)
    
    try:
        results = await scan_service.get_scan_results(current_user.id, scan_id)
        return {
            "success": True,
            "data": results
        }
    except Exception as e:
        raise ValidationException(str(e))