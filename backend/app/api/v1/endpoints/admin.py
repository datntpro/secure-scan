"""
Admin endpoints for monitoring and managing the system
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.services.zap_load_balancer import zap_load_balancer
from app.services.zap_pool_manager import zap_pool_manager
from app.core.config import settings

router = APIRouter()


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/zap/cluster-status")
async def get_zap_cluster_status(
    admin_user: User = Depends(get_admin_user)
) -> Any:
    """
    Get ZAP cluster status
    """
    try:
        if settings.ZAP_POOL_ENABLED:
            # Get load balancer status
            cluster_status = zap_load_balancer.get_cluster_status()
            
            # Get pool manager status if available
            try:
                pool_status = zap_pool_manager.get_pool_status()
                cluster_status["pool_manager"] = pool_status
            except:
                cluster_status["pool_manager"] = None
            
            return {
                "success": True,
                "data": {
                    "mode": "cluster",
                    "pool_enabled": True,
                    **cluster_status
                }
            }
        else:
            # Single instance mode
            from app.services.zap_service import ZAPService
            zap_service = ZAPService()
            
            is_healthy = await zap_service.health_check()
            
            return {
                "success": True,
                "data": {
                    "mode": "single_instance",
                    "pool_enabled": False,
                    "zap_host": settings.ZAP_HOST,
                    "zap_port": settings.ZAP_PORT,
                    "is_healthy": is_healthy
                }
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": {"message": str(e)}
        }


@router.post("/zap/add-node")
async def add_zap_node(
    host: str,
    port: int,
    api_key: str = "securescan-zap-key",
    weight: int = 1,
    admin_user: User = Depends(get_admin_user)
) -> Any:
    """
    Add a new ZAP node to the cluster
    """
    try:
        if not settings.ZAP_POOL_ENABLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ZAP pool is not enabled"
            )
        
        from app.services.zap_load_balancer import ZAPNode
        
        node = ZAPNode(
            id=f"zap-{host}-{port}",
            host=host,
            port=port,
            api_key=api_key,
            weight=weight
        )
        
        zap_load_balancer.add_node(node)
        
        return {
            "success": True,
            "message": f"Added ZAP node {node.id}",
            "data": {
                "node_id": node.id,
                "url": node.url
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/zap/remove-node/{node_id}")
async def remove_zap_node(
    node_id: str,
    admin_user: User = Depends(get_admin_user)
) -> Any:
    """
    Remove a ZAP node from the cluster
    """
    try:
        if not settings.ZAP_POOL_ENABLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ZAP pool is not enabled"
            )
        
        zap_load_balancer.remove_node(node_id)
        
        return {
            "success": True,
            "message": f"Removed ZAP node {node_id}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/system/stats")
async def get_system_stats(
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get system statistics
    """
    try:
        from sqlalchemy import select, func
        from app.models.scan import Scan, ScanStatus
        from app.models.domain import Domain
        from app.models.user import User, Subscription
        from datetime import datetime, timedelta
        
        # User statistics
        total_users_result = await db.execute(select(func.count(User.id)))
        total_users = total_users_result.scalar() or 0
        
        # Active users (logged in last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users_result = await db.execute(
            select(func.count(User.id)).where(User.last_login_at >= thirty_days_ago)
        )
        active_users = active_users_result.scalar() or 0
        
        # Domain statistics
        total_domains_result = await db.execute(select(func.count(Domain.id)))
        total_domains = total_domains_result.scalar() or 0
        
        verified_domains_result = await db.execute(
            select(func.count(Domain.id)).where(Domain.status == "verified")
        )
        verified_domains = verified_domains_result.scalar() or 0
        
        # Scan statistics
        total_scans_result = await db.execute(select(func.count(Scan.id)))
        total_scans = total_scans_result.scalar() or 0
        
        running_scans_result = await db.execute(
            select(func.count(Scan.id)).where(Scan.status == ScanStatus.RUNNING)
        )
        running_scans = running_scans_result.scalar() or 0
        
        completed_scans_result = await db.execute(
            select(func.count(Scan.id)).where(Scan.status == ScanStatus.COMPLETED)
        )
        completed_scans = completed_scans_result.scalar() or 0
        
        # Scans in last 24 hours
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_scans_result = await db.execute(
            select(func.count(Scan.id)).where(Scan.created_at >= yesterday)
        )
        recent_scans = recent_scans_result.scalar() or 0
        
        # Subscription statistics
        subscription_stats = await db.execute(
            select(Subscription.plan, func.count(Subscription.id))
            .group_by(Subscription.plan)
        )
        subscription_breakdown = dict(subscription_stats.fetchall())
        
        return {
            "success": True,
            "data": {
                "users": {
                    "total": total_users,
                    "active_30_days": active_users,
                    "subscription_breakdown": subscription_breakdown
                },
                "domains": {
                    "total": total_domains,
                    "verified": verified_domains,
                    "pending": total_domains - verified_domains
                },
                "scans": {
                    "total": total_scans,
                    "running": running_scans,
                    "completed": completed_scans,
                    "last_24_hours": recent_scans
                },
                "system": {
                    "zap_pool_enabled": settings.ZAP_POOL_ENABLED,
                    "max_concurrent_scans": settings.MAX_CONCURRENT_SCANS,
                    "environment": settings.APP_ENV
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/scans/queue-status")
async def get_scan_queue_status(
    admin_user: User = Depends(get_admin_user)
) -> Any:
    """
    Get scan queue status
    """
    try:
        if settings.ZAP_POOL_ENABLED:
            pool_status = zap_pool_manager.get_pool_status()
            return {
                "success": True,
                "data": {
                    "queue_size": pool_status.get("queue_size", 0),
                    "processing": True,
                    "instances": pool_status.get("instances", [])
                }
            }
        else:
            return {
                "success": True,
                "data": {
                    "queue_size": 0,
                    "processing": False,
                    "message": "Pool manager not enabled"
                }
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": {"message": str(e)}
        }


@router.post("/system/maintenance")
async def toggle_maintenance_mode(
    enabled: bool,
    admin_user: User = Depends(get_admin_user)
) -> Any:
    """
    Toggle system maintenance mode
    """
    try:
        # This would typically update a global flag or configuration
        # For now, we'll just return the status
        
        return {
            "success": True,
            "data": {
                "maintenance_mode": enabled,
                "message": f"Maintenance mode {'enabled' if enabled else 'disabled'}"
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )