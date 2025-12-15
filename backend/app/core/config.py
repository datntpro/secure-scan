"""
Configuration settings for SecureScan.vn
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    APP_URL: str = "http://localhost:3000"
    API_URL: str = "http://localhost:8000"
    
    # Database
    DATABASE_URL: str = "postgresql://securescan:password@localhost:5432/securescan_dev"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_ECHO: bool = False
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # JWT Authentication
    JWT_SECRET_KEY: str = "your-jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Email Configuration
    SENDGRID_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "noreply@securescan.vn"
    EMAIL_FROM_NAME: str = "SecureScan.vn"
    
    # Object Storage (S3 Compatible)
    S3_ENDPOINT: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET: str = "securescan-reports"
    S3_REGION: str = "auto"
    
    # Scan Engines - Multi-instance ZAP Configuration
    ZAP_HOST: str = "localhost"
    ZAP_PORT: int = 8080  # Default port for single instance
    ZAP_BASE_PORT: int = 8080  # Base port for multi-instance pool
    ZAP_MIN_INSTANCES: int = 2  # Minimum ZAP instances
    ZAP_MAX_INSTANCES: int = 10  # Maximum ZAP instances
    ZAP_API_KEY: str = "securescan-zap-key"
    ZAP_TIMEOUT: int = 3600  # 1 hour timeout for scans
    ZAP_POOL_ENABLED: bool = True  # Enable ZAP pool for production
    
    # Nuclei Configuration
    NUCLEI_TEMPLATES_PATH: str = "/opt/nuclei-templates"
    NUCLEI_BINARY_PATH: str = "/usr/local/bin/nuclei"
    
    # External APIs
    SSL_LABS_API_URL: str = "https://api.ssllabs.com/api/v3"
    WAPPALYZER_API_KEY: Optional[str] = None
    
    # Payment (Stripe)
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    SCAN_RATE_LIMIT_PER_HOUR: int = 10
    
    # Security
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "securescan.vn"]
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://securescan.vn"]
    
    # Scan Configuration
    MAX_CONCURRENT_SCANS: int = 50
    SCAN_TIMEOUT_MINUTES: int = 60
    MAX_URLS_PER_SCAN: int = 1000
    DEFAULT_SCAN_DEPTH: int = 5
    
    # Vietnamese Localization
    DEFAULT_LANGUAGE: str = "vi"
    TIMEZONE: str = "Asia/Ho_Chi_Minh"
    
    # Feature Flags
    ENABLE_SCHEDULED_SCANS: bool = True
    ENABLE_API_ACCESS: bool = True
    ENABLE_WHITE_LABEL_REPORTS: bool = False
    ENABLE_AUTHENTICATED_SCANNING: bool = False
    
    # Development Only
    ENABLE_DEBUG_TOOLBAR: bool = True
    ENABLE_PROFILING: bool = False
    MOCK_EXTERNAL_APIS: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()


# Subscription plans configuration
SUBSCRIPTION_PLANS = {
    "free": {
        "name": "Free",
        "price": 0,
        "scans_per_month": 1,
        "features": [
            "basic_scan",
            "basic_report",
            "email_support",
        ],
    },
    "starter": {
        "name": "Starter", 
        "price": 199000,  # VND
        "scans_per_month": 5,
        "features": [
            "standard_scan",
            "pdf_report",
            "email_alerts",
            "zalo_support",
        ],
    },
    "pro": {
        "name": "Pro",
        "price": 499000,  # VND
        "scans_per_month": -1,  # Unlimited
        "features": [
            "unlimited_scans",
            "api_access",
            "scheduled_scans",
            "deep_scan",
            "priority_support",
            "comparison_reports",
        ],
    },
    "agency": {
        "name": "Agency",
        "price": 1200000,  # VND
        "scans_per_month": -1,  # Unlimited
        "features": [
            "multi_client",
            "white_label_reports",
            "team_management",
            "custom_branding",
            "dedicated_support",
            "sla_guarantee",
        ],
    },
}


# Risk score thresholds
RISK_SCORE_THRESHOLDS = {
    "A": {"min": 0, "max": 5, "label": "Xuất sắc", "color": "green"},
    "B": {"min": 6, "max": 15, "label": "Tốt", "color": "light-green"},
    "C": {"min": 16, "max": 40, "label": "Trung bình", "color": "yellow"},
    "D": {"min": 41, "max": 80, "label": "Kém", "color": "orange"},
    "F": {"min": 81, "max": 999, "label": "Nghiêm trọng", "color": "red"},
}


# Severity weights for risk calculation
SEVERITY_WEIGHTS = {
    "critical": 40,
    "high": 20,
    "medium": 5,
    "low": 1,
    "info": 0,
}


# Vietnamese translations for common terms
VIETNAMESE_TRANSLATIONS = {
    "critical": "Nghiêm trọng",
    "high": "Cao", 
    "medium": "Trung bình",
    "low": "Thấp",
    "info": "Thông tin",
    "excellent": "Xuất sắc",
    "good": "Tốt",
    "fair": "Trung bình",
    "poor": "Kém",
    "critical_risk": "Nghiêm trọng",
}