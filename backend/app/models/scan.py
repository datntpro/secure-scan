"""
Scan related models
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as SQLEnum, Text, Time
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class ScanStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ScanType(str, enum.Enum):
    QUICK = "quick"
    STANDARD = "standard"
    THOROUGH = "thorough"


class Scan(Base):
    """Scan model"""
    
    __tablename__ = "scans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    domain_id = Column(UUID(as_uuid=True), ForeignKey("domains.id", ondelete="CASCADE"), nullable=False)
    
    # Scan details
    status = Column(SQLEnum(ScanStatus), default=ScanStatus.QUEUED, nullable=False)
    scan_type = Column(SQLEnum(ScanType), default=ScanType.STANDARD, nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    current_phase = Column(String(50), nullable=True)
    
    # Coverage metrics
    urls_discovered = Column(Integer, default=0, nullable=False)
    urls_scanned = Column(Integer, default=0, nullable=False)
    urls_skipped = Column(Integer, default=0, nullable=False)
    urls_failed = Column(Integer, default=0, nullable=False)
    
    # Results summary
    findings_critical = Column(Integer, default=0, nullable=False)
    findings_high = Column(Integer, default=0, nullable=False)
    findings_medium = Column(Integer, default=0, nullable=False)
    findings_low = Column(Integer, default=0, nullable=False)
    findings_info = Column(Integer, default=0, nullable=False)
    risk_score = Column(String(2), nullable=True)
    
    # Timing
    queued_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    scan_duration_seconds = Column(Integer, nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    
    # Report
    report_path = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="scans")
    domain = relationship("Domain", back_populates="scans")
    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")
    config = relationship("ScanConfig", back_populates="scan", uselist=False)
    
    def __repr__(self):
        return f"<Scan(id={self.id}, status={self.status}, domain_id={self.domain_id})>"


class ScanConfig(Base):
    """Scan configuration model"""
    
    __tablename__ = "scan_configs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Scan settings
    max_depth = Column(Integer, default=5, nullable=False)
    max_urls = Column(Integer, default=500, nullable=False)
    scan_speed = Column(String(20), default="normal", nullable=False)
    
    # Scope settings
    excluded_paths = Column(JSONB, default=list, nullable=False)
    included_paths = Column(JSONB, default=list, nullable=False)
    
    # Authentication
    auth_type = Column(String(20), nullable=True)
    auth_config = Column(JSONB, nullable=True)  # Encrypted
    
    # Scanner toggles
    enable_zap_passive = Column(String(10), default="true", nullable=False)
    enable_zap_active = Column(String(10), default="true", nullable=False)
    enable_nuclei = Column(String(10), default="true", nullable=False)
    enable_ssl_check = Column(String(10), default="true", nullable=False)
    enable_header_check = Column(String(10), default="true", nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    scan = relationship("Scan", back_populates="config")
    
    def __repr__(self):
        return f"<ScanConfig(id={self.id}, scan_id={self.scan_id})>"


class ScheduledScan(Base):
    """Scheduled scan model"""
    
    __tablename__ = "scheduled_scans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    domain_id = Column(UUID(as_uuid=True), ForeignKey("domains.id", ondelete="CASCADE"), nullable=False)
    
    # Schedule settings
    frequency = Column(String(20), nullable=False)  # daily, weekly, monthly
    day_of_week = Column(Integer, nullable=True)  # 0-6
    day_of_month = Column(Integer, nullable=True)  # 1-28
    time_utc = Column(Time, nullable=False)
    
    # Scan settings
    scan_type = Column(SQLEnum(ScanType), default=ScanType.STANDARD, nullable=False)
    enabled = Column(String(10), default="true", nullable=False)
    
    # Execution tracking
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    last_scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id"), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=False)
    
    # Notifications
    notify_on_complete = Column(String(10), default="true", nullable=False)
    notify_on_new_findings = Column(String(10), default="true", nullable=False)
    notification_emails = Column(JSONB, default=list, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<ScheduledScan(id={self.id}, domain_id={self.domain_id}, frequency={self.frequency})>"