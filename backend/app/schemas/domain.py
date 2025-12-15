"""
Domain schemas
"""

from pydantic import BaseModel, HttpUrl, validator
from typing import Optional
from datetime import datetime
import uuid

from app.models.domain import DomainStatus, VerificationMethod


class DomainBase(BaseModel):
    url: HttpUrl
    description: Optional[str] = None


class DomainCreate(DomainBase):
    pass
    
    @validator('url')
    def validate_url(cls, v):
        url_str = str(v)
        if not (url_str.startswith('http://') or url_str.startswith('https://')):
            raise ValueError('URL must start with http:// or https://')
        return v


class DomainUpdate(BaseModel):
    description: Optional[str] = None
    auto_scan_enabled: Optional[bool] = None
    auto_scan_frequency: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    
    @validator('auto_scan_frequency')
    def validate_frequency(cls, v):
        if v and v not in ['daily', 'weekly', 'monthly']:
            raise ValueError('Frequency must be daily, weekly, or monthly')
        return v


class DomainVerification(BaseModel):
    method: VerificationMethod


class DomainResponse(BaseModel):
    id: uuid.UUID
    url: str
    description: Optional[str]
    status: DomainStatus
    verification_method: Optional[VerificationMethod]
    verified_at: Optional[datetime]
    last_scan_at: Optional[datetime]
    last_scan_id: Optional[uuid.UUID]
    risk_score: Optional[str]
    auto_scan_enabled: bool
    auto_scan_frequency: str
    notifications_enabled: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        
    @property
    def hostname(self):
        """Extract hostname from URL"""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(self.url)
            return parsed.netloc
        except:
            return self.url


class DomainVerificationInfo(BaseModel):
    domain_id: uuid.UUID
    url: str
    status: DomainStatus
    verification_methods: dict
    dns_record: Optional[dict] = None
    file_verification: Optional[dict] = None
    
    class Config:
        from_attributes = True