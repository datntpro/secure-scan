"""
Reports endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Optional, Dict, Any
import uuid
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.exceptions import ValidationException, NotFoundException
from app.models.user import User
from app.models.scan import Scan, Vulnerability
from app.models.domain import Domain
from app.services.report_service import ReportService

router = APIRouter()


@router.get("/dashboard", response_model=dict)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thống kê cho dashboard
    """
    report_service = ReportService(db)
    
    try:
        stats = await report_service.get_dashboard_stats(current_user.id)
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.get("/activity", response_model=dict)
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy hoạt động gần đây
    """
    report_service = ReportService(db)
    
    try:
        activity = await report_service.get_recent_activity(current_user.id, limit)
        return {
            "success": True,
            "data": activity
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.get("/scan/{scan_id}", response_model=dict)
async def get_scan_report(
    scan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy báo cáo chi tiết của scan
    """
    report_service = ReportService(db)
    
    try:
        report = await report_service.get_scan_report(current_user.id, scan_id)
        return {
            "success": True,
            "data": report
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.get("/domain/{domain_id}", response_model=dict)
async def get_domain_report(
    domain_id: uuid.UUID,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy báo cáo tổng hợp của domain
    """
    report_service = ReportService(db)
    
    try:
        report = await report_service.get_domain_report(current_user.id, domain_id, days)
        return {
            "success": True,
            "data": report
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.get("/vulnerabilities", response_model=dict)
async def get_vulnerabilities_summary(
    domain_id: Optional[uuid.UUID] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy tổng hợp vulnerabilities
    """
    report_service = ReportService(db)
    
    try:
        summary = await report_service.get_vulnerabilities_summary(
            current_user.id, domain_id, severity, status, days
        )
        return {
            "success": True,
            "data": summary
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.get("/trends", response_model=dict)
async def get_security_trends(
    days: int = Query(30, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy xu hướng bảo mật theo thời gian
    """
    report_service = ReportService(db)
    
    try:
        trends = await report_service.get_security_trends(current_user.id, days)
        return {
            "success": True,
            "data": trends
        }
    except Exception as e:
        raise ValidationException(str(e))


@router.post("/export/{scan_id}", response_model=dict)
async def export_scan_report(
    scan_id: uuid.UUID,
    format: str = Query("pdf", regex="^(pdf|html|json)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export báo cáo scan
    """
    report_service = ReportService(db)
    
    try:
        export_url = await report_service.export_scan_report(current_user.id, scan_id, format)
        return {
            "success": True,
            "message": f"Báo cáo đã được tạo định dạng {format.upper()}",
            "data": {
                "download_url": export_url,
                "format": format,
                "expires_at": datetime.utcnow() + timedelta(hours=24)
            }
        }
    except Exception as e:
        raise ValidationException(str(e))