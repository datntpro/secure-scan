"""
Scan service
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Dict, Any, Optional
import uuid
import asyncio
from datetime import datetime

from app.models.scan import Scan, ScanStatus, ScanType, Vulnerability
from app.models.domain import Domain
from app.models.user import User, Subscription
from app.schemas.scan import ScanCreate, BulkScanCreate
from app.core.exceptions import ValidationException, NotFoundException
from app.services.zap_service import ZAPService
from app.services.zap_load_balancer import zap_load_balancer
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class ScanService:
    """Scan management service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.use_load_balancer = settings.ZAP_POOL_ENABLED
    
    async def create_scan(self, user_id: uuid.UUID, scan_data: ScanCreate) -> Scan:
        """Create new scan"""
        
        # Check if user can create scan
        await self._check_scan_limits(user_id)
        
        # Verify domain ownership
        domain = await self._get_user_domain(user_id, scan_data.domain_id)
        if not domain.can_scan():
            raise ValidationException("Domain chưa được xác minh. Vui lòng xác minh domain trước khi scan.")
        
        # Create scan
        scan = Scan(
            user_id=user_id,
            domain_id=scan_data.domain_id,
            scan_type=scan_data.scan_type,
            scan_options=scan_data.scan_options or {}
        )
        
        self.db.add(scan)
        await self.db.commit()
        await self.db.refresh(scan)
        
        # Start scan asynchronously
        asyncio.create_task(self._execute_scan(scan.id))
        
        # Update subscription usage
        await self._increment_scan_usage(user_id)
        
        return scan
    
    async def create_bulk_scans(self, user_id: uuid.UUID, bulk_data: BulkScanCreate) -> List[Scan]:
        """Create multiple scans"""
        
        # Check if user can create scans
        await self._check_scan_limits(user_id, len(bulk_data.domain_ids))
        
        scans = []
        for domain_id in bulk_data.domain_ids:
            # Verify domain ownership
            domain = await self._get_user_domain(user_id, domain_id)
            if not domain.can_scan():
                continue  # Skip unverified domains
            
            scan = Scan(
                user_id=user_id,
                domain_id=domain_id,
                scan_type=bulk_data.scan_type,
                scan_options=bulk_data.scan_options or {}
            )
            
            self.db.add(scan)
            scans.append(scan)
        
        await self.db.commit()
        
        # Start scans asynchronously
        for scan in scans:
            await self.db.refresh(scan)
            asyncio.create_task(self._execute_scan(scan.id))
        
        # Update subscription usage
        await self._increment_scan_usage(user_id, len(scans))
        
        return scans
    
    async def delete_scan(self, user_id: uuid.UUID, scan_id: uuid.UUID):
        """Delete scan"""
        
        result = await self.db.execute(
            select(Scan).where(
                and_(
                    Scan.id == scan_id,
                    Scan.user_id == user_id
                )
            )
        )
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise NotFoundException("Scan không tồn tại")
        
        # Can't delete running scans
        if scan.status == ScanStatus.RUNNING:
            raise ValidationException("Không thể xóa scan đang chạy. Vui lòng dừng scan trước.")
        
        await self.db.delete(scan)
        await self.db.commit()
    
    async def stop_scan(self, user_id: uuid.UUID, scan_id: uuid.UUID) -> Scan:
        """Stop running scan"""
        
        result = await self.db.execute(
            select(Scan).where(
                and_(
                    Scan.id == scan_id,
                    Scan.user_id == user_id
                )
            )
        )
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise NotFoundException("Scan không tồn tại")
        
        if scan.status != ScanStatus.RUNNING:
            raise ValidationException("Scan không đang chạy")
        
        # Update scan status
        scan.status = ScanStatus.CANCELLED
        scan.completed_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(scan)
        
        return scan
    
    async def get_scan_results(self, user_id: uuid.UUID, scan_id: uuid.UUID) -> Dict[str, Any]:
        """Get scan results"""
        
        result = await self.db.execute(
            select(Scan).where(
                and_(
                    Scan.id == scan_id,
                    Scan.user_id == user_id
                )
            )
        )
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise NotFoundException("Scan không tồn tại")
        
        # Get vulnerabilities
        vuln_result = await self.db.execute(
            select(Vulnerability).where(Vulnerability.scan_id == scan_id)
        )
        vulnerabilities = vuln_result.scalars().all()
        
        return {
            "scan": {
                "id": str(scan.id),
                "status": scan.status,
                "progress": scan.progress,
                "risk_score": scan.risk_score,
                "started_at": scan.started_at,
                "completed_at": scan.completed_at,
                "duration_seconds": scan.duration_seconds,
                "vulnerabilities_found": scan.vulnerabilities_found,
                "critical_count": scan.critical_count,
                "high_count": scan.high_count,
                "medium_count": scan.medium_count,
                "low_count": scan.low_count,
                "info_count": scan.info_count,
            },
            "vulnerabilities": [
                {
                    "id": str(vuln.id),
                    "title": vuln.title,
                    "description": vuln.description,
                    "severity": vuln.severity,
                    "cvss_score": vuln.cvss_score,
                    "cve_id": vuln.cve_id,
                    "affected_url": vuln.affected_url,
                    "evidence": vuln.evidence,
                    "recommendation": vuln.recommendation,
                    "status": vuln.status,
                }
                for vuln in vulnerabilities
            ]
        }
    
    async def _check_scan_limits(self, user_id: uuid.UUID, scan_count: int = 1):
        """Check if user can create scans"""
        
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            raise ValidationException("Không tìm thấy thông tin subscription")
        
        if not subscription.can_scan():
            raise ValidationException("Bạn đã hết lượt scan cho tháng này. Vui lòng nâng cấp gói.")
        
        if subscription.scans_used_this_month + scan_count > subscription.scans_limit:
            raise ValidationException(f"Không đủ lượt scan. Bạn cần {scan_count} lượt nhưng chỉ còn {subscription.scans_limit - subscription.scans_used_this_month} lượt.")
    
    async def _get_user_domain(self, user_id: uuid.UUID, domain_id: uuid.UUID) -> Domain:
        """Get user's domain"""
        
        result = await self.db.execute(
            select(Domain).where(
                and_(
                    Domain.id == domain_id,
                    Domain.user_id == user_id
                )
            )
        )
        domain = result.scalar_one_or_none()
        
        if not domain:
            raise NotFoundException("Domain không tồn tại")
        
        return domain
    
    async def _increment_scan_usage(self, user_id: uuid.UUID, count: int = 1):
        """Increment scan usage for user"""
        
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()
        
        if subscription:
            subscription.scans_used_this_month += count
            await self.db.commit()
    
    async def _execute_scan(self, scan_id: uuid.UUID):
        """Execute scan using OWASP ZAP"""
        
        try:
            # Get scan from database
            result = await self.db.execute(
                select(Scan).join(Domain).where(Scan.id == scan_id)
            )
            scan_data = result.first()
            
            if not scan_data:
                return
            
            scan, domain = scan_data
            
            # Update scan status to RUNNING
            scan.status = ScanStatus.RUNNING
            scan.started_at = datetime.utcnow()
            scan.progress = 0
            await self.db.commit()
            
            # Get ZAP instance (load balanced or single)
            if self.use_load_balancer:
                zap_node = await zap_load_balancer.assign_scan(str(scan_id))
                if not zap_node:
                    raise Exception("No available ZAP instances")
                
                # Create ZAP service for assigned node
                zap_service = ZAPService()
                zap_service.zap_host = zap_node.host
                zap_service.zap_port = zap_node.port
                zap_service.zap_api_key = zap_node.api_key
                zap_service.base_url = zap_node.url
            else:
                # Single instance mode
                zap_service = ZAPService()
                zap_node = None
            
            # Check ZAP health
            if not await zap_service.health_check():
                if zap_node:
                    await zap_load_balancer.release_scan(zap_node.id, str(scan_id))
                raise Exception("OWASP ZAP is not accessible")
            
            # Start ZAP scan
            zap_result = await zap_service.start_scan(
                domain.url, 
                scan.scan_options or {}
            )
            
            # Store ZAP scan IDs
            scan.scan_options = scan.scan_options or {}
            scan.scan_options.update({
                'spider_scan_id': zap_result['spider_scan_id'],
                'active_scan_id': zap_result['active_scan_id']
            })
            await self.db.commit()
            
            # Monitor scan progress
            while True:
                progress_data = await zap_service.get_scan_progress(
                    zap_result['spider_scan_id'],
                    zap_result['active_scan_id']
                )
                
                scan.progress = progress_data['overall_progress']
                await self.db.commit()
                
                # Send WebSocket update
                try:
                    from app.api.v1.endpoints.websocket import send_scan_progress_update
                    await send_scan_progress_update(
                        scan.id,
                        scan.user_id,
                        {
                            'status': scan.status,
                            'progress': scan.progress,
                            'spider_progress': progress_data.get('spider_progress'),
                            'active_progress': progress_data.get('active_progress'),
                            'started_at': scan.started_at.isoformat() if scan.started_at else None
                        }
                    )
                except Exception as ws_error:
                    # Don't fail scan if WebSocket fails
                    logger.warning(f"WebSocket update failed: {ws_error}")
                
                if progress_data['status'] == 'completed':
                    break
                elif progress_data['status'] == 'failed':
                    raise Exception("ZAP scan failed")
                
                await asyncio.sleep(10)  # Check every 10 seconds
            
            # Get scan results
            scan_results = await zap_service.get_scan_results(domain.url)
            
            # Save vulnerabilities to database
            await self._save_vulnerabilities(scan_id, scan_results['vulnerabilities'])
            
            # Update scan completion
            scan.status = ScanStatus.COMPLETED
            scan.completed_at = datetime.utcnow()
            scan.duration_seconds = int((scan.completed_at - scan.started_at).total_seconds())
            scan.risk_score = scan_results['risk_score']
            scan.vulnerabilities_found = scan_results['total_vulnerabilities']
            scan.critical_count = scan_results['severity_counts']['critical']
            scan.high_count = scan_results['severity_counts']['high']
            scan.medium_count = scan_results['severity_counts']['medium']
            scan.low_count = scan_results['severity_counts']['low']
            scan.info_count = scan_results['severity_counts']['info']
            
            # Update domain's last scan info
            domain.last_scan_at = scan.completed_at
            domain.last_scan_id = scan.id
            domain.risk_score = scan.risk_score
            
            await self.db.commit()
            
            # Send final WebSocket update
            try:
                from app.api.v1.endpoints.websocket import send_scan_progress_update
                await send_scan_progress_update(
                    scan.id,
                    scan.user_id,
                    {
                        'status': scan.status,
                        'progress': 100,
                        'completed_at': scan.completed_at.isoformat() if scan.completed_at else None,
                        'vulnerabilities_found': scan.vulnerabilities_found,
                        'risk_score': scan.risk_score
                    }
                )
            except Exception as ws_error:
                logger.warning(f"WebSocket completion update failed: {ws_error}")
            
            # Release ZAP instance if using load balancer
            if self.use_load_balancer and zap_node:
                await zap_load_balancer.release_scan(zap_node.id, str(scan_id))
            
            # TODO: Send notification email
            
        except Exception as e:
            print(f"Scan execution error: {e}")
            # Update scan status to failed
            result = await self.db.execute(
                select(Scan).where(Scan.id == scan_id)
            )
            scan = result.scalar_one_or_none()
            if scan:
                scan.status = ScanStatus.FAILED
                scan.error_message = str(e)
                scan.completed_at = datetime.utcnow()
                if scan.started_at:
                    scan.duration_seconds = int((scan.completed_at - scan.started_at).total_seconds())
                await self.db.commit()
    
    async def _save_vulnerabilities(self, scan_id: uuid.UUID, vulnerabilities: List[Dict[str, Any]]):
        """Save vulnerabilities to database"""
        
        for vuln_data in vulnerabilities:
            vulnerability = Vulnerability(
                scan_id=scan_id,
                title=vuln_data['title'],
                description=vuln_data['description'],
                severity=vuln_data['severity'],
                cvss_score=vuln_data.get('cvss_score'),
                cwe_id=vuln_data.get('cwe_id'),
                affected_url=vuln_data['affected_url'],
                method=vuln_data.get('method', 'GET'),
                parameter=vuln_data.get('parameter', ''),
                attack_vector=vuln_data.get('attack', ''),
                evidence=vuln_data.get('evidence', ''),
                recommendation=vuln_data.get('solution', ''),
                references=vuln_data.get('reference', ''),
                plugin_id=vuln_data.get('plugin_id'),
                confidence=vuln_data.get('confidence', 'Medium'),
                status='open'
            )
            
            self.db.add(vulnerability)
        
        await self.db.commit()