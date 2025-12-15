"""
Scan schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from app.models.scan import ScanStatus, ScanType


class ScanBase(BaseModel):
    domain_id: uuid.UUID
    scan_type: ScanType = ScanType.FULL
    scan_options: Optional[Dict[str, Any]] = None


class ScanCreate(ScanBase):
    pass


class BulkScanCreate(BaseModel):
    domain_ids: List[uuid.UUID]
    scan_type: ScanType = ScanType.FULL
    scan_options: Optional[Dict[str, Any]] = None


class ScanResponse(BaseModel):
    id: uuid.UUID
    domain_id: uuid.UUID
    user_id: uuid.UUID
    scan_type: ScanType
    status: ScanStatus
    progress: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_seconds: Optional[int]
    risk_score: Optional[str]
    vulnerabilities_found: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    scan_options: Optional[Dict[str, Any]]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ScanResultSummary(BaseModel):
    scan_id: uuid.UUID
    domain_url: str
    status: ScanStatus
    risk_score: Optional[str]
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    scan_duration: Optional[int]
    completed_at: Optional[datetime]


class VulnerabilityResponse(BaseModel):
    id: uuid.UUID
    scan_id: uuid.UUID
    title: str
    description: str
    severity: str
    cvss_score: Optional[float]
    cve_id: Optional[str]
    affected_url: str
    evidence: Optional[str]
    recommendation: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True