"""
Report service
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime, timedelta

from app.models.scan import Scan, Vulnerability, ScanStatus
from app.models.domain import Domain
from app.models.user import User, Subscription
from app.core.exceptions import ValidationException, NotFoundException


class ReportService:
    """Report generation service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_dashboard_stats(self, user_id: uuid.UUID) -> Dict[str, Any]:
        """Get dashboard statistics"""
        
        # Total domains
        domains_result = await self.db.execute(
            select(func.count(Domain.id)).where(Domain.user_id == user_id)
        )
        total_domains = domains_result.scalar() or 0
        
        # Total scans this month
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        scans_result = await self.db.execute(
            select(func.count(Scan.id)).where(
                and_(
                    Scan.user_id == user_id,
                    Scan.created_at >= start_of_month
                )
            )
        )
        total_scans = scans_result.scalar() or 0
        
        # Open issues (vulnerabilities with status 'open')
        issues_result = await self.db.execute(
            select(func.count(Vulnerability.id)).where(
                and_(
                    Vulnerability.scan_id.in_(
                        select(Scan.id).where(Scan.user_id == user_id)
                    ),
                    Vulnerability.status == "open"
                )
            )
        )
        open_issues = issues_result.scalar() or 0
        
        # Average risk score (simplified calculation)
        risk_result = await self.db.execute(
            select(Scan.risk_score).where(
                and_(
                    Scan.user_id == user_id,
                    Scan.risk_score.isnot(None),
                    Scan.status == ScanStatus.COMPLETED
                )
            ).order_by(desc(Scan.completed_at)).limit(10)
        )
        risk_scores = risk_result.scalars().all()
        
        # Calculate average risk score
        if risk_scores:
            score_values = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1}
            avg_value = sum(score_values.get(score, 3) for score in risk_scores) / len(risk_scores)
            avg_score = 'A' if avg_value >= 4.5 else 'B' if avg_value >= 3.5 else 'C' if avg_value >= 2.5 else 'D' if avg_value >= 1.5 else 'F'
        else:
            avg_score = 'B'
        
        return {
            "totalDomains": total_domains,
            "totalScans": total_scans,
            "openIssues": open_issues,
            "averageRiskScore": avg_score
        }
    
    async def get_recent_activity(self, user_id: uuid.UUID, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent activity"""
        
        # Get recent scans with domain info
        result = await self.db.execute(
            select(Scan, Domain.url).join(Domain).where(
                Scan.user_id == user_id
            ).order_by(desc(Scan.updated_at)).limit(limit)
        )
        
        activities = []
        for scan, domain_url in result:
            activity_type = "scan_completed"
            message = "Scan hoàn thành"
            
            if scan.status == ScanStatus.COMPLETED:
                if scan.critical_count > 0 or scan.high_count > 0:
                    activity_type = "issue_found"
                    message = f"Phát hiện {scan.critical_count + scan.high_count} lỗi nghiêm trọng"
                else:
                    message = f"Scan hoàn thành • {scan.vulnerabilities_found} lỗi phát hiện"
            elif scan.status == ScanStatus.FAILED:
                activity_type = "scan_failed"
                message = "Scan thất bại"
            elif scan.status == ScanStatus.RUNNING:
                activity_type = "scan_running"
                message = f"Đang scan • {scan.progress}% hoàn thành"
            
            activities.append({
                "id": str(scan.id),
                "type": activity_type,
                "domain_url": domain_url,
                "message": message,
                "risk_score": scan.risk_score,
                "severity": "critical" if scan.critical_count > 0 else "high" if scan.high_count > 0 else "medium",
                "created_at": scan.updated_at.isoformat()
            })
        
        return activities
    
    async def get_scan_report(self, user_id: uuid.UUID, scan_id: uuid.UUID) -> Dict[str, Any]:
        """Get detailed scan report"""
        
        # Get scan with domain info
        result = await self.db.execute(
            select(Scan, Domain.url).join(Domain).where(
                and_(
                    Scan.id == scan_id,
                    Scan.user_id == user_id
                )
            )
        )
        scan_data = result.first()
        
        if not scan_data:
            raise NotFoundException("Scan không tồn tại")
        
        scan, domain_url = scan_data
        
        # Get vulnerabilities
        vuln_result = await self.db.execute(
            select(Vulnerability).where(Vulnerability.scan_id == scan_id)
        )
        vulnerabilities = vuln_result.scalars().all()
        
        # Group vulnerabilities by severity
        vuln_by_severity = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": [],
            "info": []
        }
        
        for vuln in vulnerabilities:
            severity = vuln.severity.lower()
            if severity in vuln_by_severity:
                vuln_by_severity[severity].append({
                    "id": str(vuln.id),
                    "title": vuln.title,
                    "description": vuln.description,
                    "cvss_score": vuln.cvss_score,
                    "cve_id": vuln.cve_id,
                    "affected_url": vuln.affected_url,
                    "evidence": vuln.evidence,
                    "recommendation": vuln.recommendation,
                    "status": vuln.status
                })
        
        return {
            "scan": {
                "id": str(scan.id),
                "domain_url": domain_url,
                "status": scan.status,
                "scan_type": scan.scan_type,
                "started_at": scan.started_at.isoformat() if scan.started_at else None,
                "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
                "duration_seconds": scan.duration_seconds,
                "progress": scan.progress,
                "risk_score": scan.risk_score,
                "vulnerabilities_found": scan.vulnerabilities_found,
                "critical_count": scan.critical_count,
                "high_count": scan.high_count,
                "medium_count": scan.medium_count,
                "low_count": scan.low_count,
                "info_count": scan.info_count,
                "error_message": scan.error_message
            },
            "vulnerabilities": vuln_by_severity,
            "summary": {
                "total_vulnerabilities": len(vulnerabilities),
                "risk_level": self._calculate_risk_level(scan),
                "recommendations": self._get_top_recommendations(vulnerabilities)
            }
        }
    
    async def get_domain_report(self, user_id: uuid.UUID, domain_id: uuid.UUID, days: int) -> Dict[str, Any]:
        """Get domain summary report"""
        
        # Verify domain ownership
        domain_result = await self.db.execute(
            select(Domain).where(
                and_(
                    Domain.id == domain_id,
                    Domain.user_id == user_id
                )
            )
        )
        domain = domain_result.scalar_one_or_none()
        
        if not domain:
            raise NotFoundException("Domain không tồn tại")
        
        # Get scans for the period
        start_date = datetime.utcnow() - timedelta(days=days)
        scans_result = await self.db.execute(
            select(Scan).where(
                and_(
                    Scan.domain_id == domain_id,
                    Scan.created_at >= start_date,
                    Scan.status == ScanStatus.COMPLETED
                )
            ).order_by(desc(Scan.completed_at))
        )
        scans = scans_result.scalars().all()
        
        # Calculate trends
        risk_trend = []
        vuln_trend = []
        
        for scan in scans:
            risk_trend.append({
                "date": scan.completed_at.date().isoformat(),
                "risk_score": scan.risk_score,
                "score_value": {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1}.get(scan.risk_score, 3)
            })
            
            vuln_trend.append({
                "date": scan.completed_at.date().isoformat(),
                "total": scan.vulnerabilities_found,
                "critical": scan.critical_count,
                "high": scan.high_count,
                "medium": scan.medium_count,
                "low": scan.low_count
            })
        
        return {
            "domain": {
                "id": str(domain.id),
                "url": domain.url,
                "description": domain.description,
                "status": domain.status,
                "last_scan_at": domain.last_scan_at.isoformat() if domain.last_scan_at else None,
                "current_risk_score": domain.risk_score
            },
            "period": {
                "days": days,
                "start_date": start_date.date().isoformat(),
                "end_date": datetime.utcnow().date().isoformat()
            },
            "summary": {
                "total_scans": len(scans),
                "avg_vulnerabilities": sum(s.vulnerabilities_found for s in scans) / len(scans) if scans else 0,
                "trend_direction": self._calculate_trend_direction(scans)
            },
            "trends": {
                "risk_scores": risk_trend,
                "vulnerabilities": vuln_trend
            }
        }
    
    async def get_vulnerabilities_summary(
        self, 
        user_id: uuid.UUID, 
        domain_id: Optional[uuid.UUID] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get vulnerabilities summary"""
        
        # Build query
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = select(Vulnerability).join(Scan).where(
            and_(
                Scan.user_id == user_id,
                Scan.created_at >= start_date
            )
        )
        
        if domain_id:
            query = query.where(Scan.domain_id == domain_id)
        if severity:
            query = query.where(Vulnerability.severity == severity)
        if status:
            query = query.where(Vulnerability.status == status)
        
        result = await self.db.execute(query)
        vulnerabilities = result.scalars().all()
        
        # Group by severity
        by_severity = {}
        for vuln in vulnerabilities:
            severity_key = vuln.severity.lower()
            if severity_key not in by_severity:
                by_severity[severity_key] = []
            by_severity[severity_key].append(vuln)
        
        return {
            "total": len(vulnerabilities),
            "by_severity": {
                severity: len(vulns) for severity, vulns in by_severity.items()
            },
            "by_status": {
                "open": len([v for v in vulnerabilities if v.status == "open"]),
                "fixed": len([v for v in vulnerabilities if v.status == "fixed"]),
                "ignored": len([v for v in vulnerabilities if v.status == "ignored"])
            }
        }
    
    async def get_security_trends(self, user_id: uuid.UUID, days: int) -> Dict[str, Any]:
        """Get security trends over time"""
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get scans over time
        result = await self.db.execute(
            select(Scan).where(
                and_(
                    Scan.user_id == user_id,
                    Scan.created_at >= start_date,
                    Scan.status == ScanStatus.COMPLETED
                )
            ).order_by(Scan.completed_at)
        )
        scans = result.scalars().all()
        
        # Calculate daily trends
        daily_stats = {}
        for scan in scans:
            date_key = scan.completed_at.date().isoformat()
            if date_key not in daily_stats:
                daily_stats[date_key] = {
                    "scans": 0,
                    "vulnerabilities": 0,
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0
                }
            
            daily_stats[date_key]["scans"] += 1
            daily_stats[date_key]["vulnerabilities"] += scan.vulnerabilities_found
            daily_stats[date_key]["critical"] += scan.critical_count
            daily_stats[date_key]["high"] += scan.high_count
            daily_stats[date_key]["medium"] += scan.medium_count
            daily_stats[date_key]["low"] += scan.low_count
        
        return {
            "period": {
                "days": days,
                "start_date": start_date.date().isoformat(),
                "end_date": datetime.utcnow().date().isoformat()
            },
            "daily_stats": daily_stats,
            "totals": {
                "scans": len(scans),
                "vulnerabilities": sum(s.vulnerabilities_found for s in scans),
                "critical": sum(s.critical_count for s in scans),
                "high": sum(s.high_count for s in scans),
                "medium": sum(s.medium_count for s in scans),
                "low": sum(s.low_count for s in scans)
            }
        }
    
    async def export_scan_report(self, user_id: uuid.UUID, scan_id: uuid.UUID, format: str) -> str:
        """Export scan report (placeholder)"""
        
        # Verify scan ownership
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
        
        # In real implementation, this would generate the report file
        # and return a download URL
        return f"/api/v1/reports/download/{scan_id}.{format}"
    
    def _calculate_risk_level(self, scan: Scan) -> str:
        """Calculate risk level based on vulnerabilities"""
        if scan.critical_count > 0:
            return "critical"
        elif scan.high_count > 0:
            return "high"
        elif scan.medium_count > 0:
            return "medium"
        elif scan.low_count > 0:
            return "low"
        else:
            return "info"
    
    def _get_top_recommendations(self, vulnerabilities: List[Vulnerability]) -> List[str]:
        """Get top recommendations"""
        recommendations = []
        
        # Group by recommendation and count
        rec_counts = {}
        for vuln in vulnerabilities:
            if vuln.recommendation:
                rec_counts[vuln.recommendation] = rec_counts.get(vuln.recommendation, 0) + 1
        
        # Sort by count and return top 5
        sorted_recs = sorted(rec_counts.items(), key=lambda x: x[1], reverse=True)
        return [rec for rec, count in sorted_recs[:5]]
    
    def _calculate_trend_direction(self, scans: List[Scan]) -> str:
        """Calculate trend direction"""
        if len(scans) < 2:
            return "stable"
        
        recent_avg = sum(s.vulnerabilities_found for s in scans[:3]) / min(3, len(scans))
        older_avg = sum(s.vulnerabilities_found for s in scans[-3:]) / min(3, len(scans))
        
        if recent_avg > older_avg * 1.1:
            return "worsening"
        elif recent_avg < older_avg * 0.9:
            return "improving"
        else:
            return "stable"