"""
Finding model
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class Severity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class Confidence(str, enum.Enum):
    CONFIRMED = "confirmed"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class FindingStatus(str, enum.Enum):
    OPEN = "open"
    FIXED = "fixed"
    FALSE_POSITIVE = "false_positive"
    ACCEPTED = "accepted"


class Finding(Base):
    """Finding model"""
    
    __tablename__ = "findings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False)
    
    # Identification
    fingerprint = Column(String(64), nullable=False, index=True)
    
    # Basic info
    title = Column(String(500), nullable=False)
    title_vi = Column(String(500), nullable=True)
    severity = Column(SQLEnum(Severity), nullable=False, index=True)
    confidence = Column(SQLEnum(Confidence), default=Confidence.MEDIUM, nullable=False)
    
    # Classification
    owasp_category = Column(String(100), nullable=True)
    cwe_id = Column(String(20), nullable=True, index=True)
    cve_id = Column(String(30), nullable=True)
    cvss_score = Column(Numeric(3, 1), nullable=True)
    
    # Details
    description = Column(Text, nullable=True)
    description_vi = Column(Text, nullable=True)
    affected_url = Column(String(2048), nullable=True)
    affected_parameter = Column(String(255), nullable=True)
    evidence = Column(Text, nullable=True)
    
    # Remediation
    solution = Column(Text, nullable=True)
    solution_vi = Column(Text, nullable=True)
    references = Column(JSONB, default=list, nullable=False)
    
    # Source tracking
    source = Column(String(50), nullable=False)  # zap, nuclei, ssl_check, etc.
    source_rule_id = Column(String(100), nullable=True)
    raw_data = Column(JSONB, nullable=True)
    
    # Status
    status = Column(SQLEnum(FindingStatus), default=FindingStatus.OPEN, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    scan = relationship("Scan", back_populates="findings")
    
    def __repr__(self):
        return f"<Finding(id={self.id}, title={self.title}, severity={self.severity})>"