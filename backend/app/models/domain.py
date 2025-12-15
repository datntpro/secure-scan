"""
Domain model
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class DomainStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"


class VerificationMethod(str, enum.Enum):
    DNS_TXT = "dns_txt"
    FILE_UPLOAD = "file_upload"


class Domain(Base):
    """Domain model"""
    
    __tablename__ = "domains"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Domain info
    url = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(DomainStatus), default=DomainStatus.PENDING, nullable=False)
    
    # Verification
    verification_method = Column(SQLEnum(VerificationMethod), nullable=True)
    verification_token = Column(String(64), nullable=True)
    verification_file_content = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Scan info
    last_scan_at = Column(DateTime(timezone=True), nullable=True)
    last_scan_id = Column(UUID(as_uuid=True), nullable=True)
    risk_score = Column(String(1), nullable=True)  # A, B, C, D, F
    
    # Settings
    auto_scan_enabled = Column(Boolean, default=False, nullable=False)
    auto_scan_frequency = Column(String(20), default="weekly", nullable=False)  # daily, weekly, monthly
    notifications_enabled = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="domains")
    scans = relationship("Scan", back_populates="domain", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Domain(id={self.id}, url={self.url}, status={self.status})>"
    
    @property
    def hostname(self):
        """Extract hostname from URL"""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(self.url)
            return parsed.netloc
        except:
            return self.url
    
    def is_verified(self) -> bool:
        """Check if domain is verified"""
        return self.status == DomainStatus.VERIFIED
    
    def can_scan(self) -> bool:
        """Check if domain can be scanned"""
        return self.is_verified()