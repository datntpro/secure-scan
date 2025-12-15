"""
Custom exceptions for SecureScan.vn
"""

from typing import Any, Dict, Optional


class SecureScanException(Exception):
    """Base exception for SecureScan.vn"""
    
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error_code: str = "GENERAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


# Authentication Exceptions
class AuthenticationException(SecureScanException):
    """Authentication related exceptions"""
    
    def __init__(self, message: str = "Xác thực thất bại", **kwargs):
        super().__init__(message, status_code=401, error_code="AUTH_FAILED", **kwargs)


class InvalidCredentialsException(AuthenticationException):
    """Invalid login credentials"""
    
    def __init__(self, message: str = "Email hoặc mật khẩu không đúng", **kwargs):
        super().__init__(message, error_code="INVALID_CREDENTIALS", **kwargs)


class TokenExpiredException(AuthenticationException):
    """JWT token expired"""
    
    def __init__(self, message: str = "Phiên đăng nhập đã hết hạn", **kwargs):
        super().__init__(message, error_code="TOKEN_EXPIRED", **kwargs)


class AccountLockedException(AuthenticationException):
    """Account is locked"""
    
    def __init__(self, message: str = "Tài khoản đã bị khóa", **kwargs):
        super().__init__(message, status_code=403, error_code="ACCOUNT_LOCKED", **kwargs)


# Domain Exceptions
class DomainException(SecureScanException):
    """Domain related exceptions"""
    pass


class DomainNotVerifiedException(DomainException):
    """Domain not verified"""
    
    def __init__(self, message: str = "Domain chưa được xác minh", **kwargs):
        super().__init__(message, error_code="DOMAIN_NOT_VERIFIED", **kwargs)


class DomainBlacklistedException(DomainException):
    """Domain is blacklisted"""
    
    def __init__(self, message: str = "Domain này không được phép scan", **kwargs):
        super().__init__(message, error_code="DOMAIN_BLACKLISTED", **kwargs)


class InvalidDomainException(DomainException):
    """Invalid domain format"""
    
    def __init__(self, message: str = "Định dạng domain không hợp lệ", **kwargs):
        super().__init__(message, error_code="INVALID_DOMAIN", **kwargs)


# Scan Exceptions
class ScanException(SecureScanException):
    """Scan related exceptions"""
    pass


class QuotaExceededException(ScanException):
    """Scan quota exceeded"""
    
    def __init__(self, message: str = "Bạn đã hết lượt scan tháng này", **kwargs):
        super().__init__(message, status_code=402, error_code="QUOTA_EXCEEDED", **kwargs)


class ScanAlreadyRunningException(ScanException):
    """Scan already running for domain"""
    
    def __init__(self, message: str = "Domain này đang được scan", **kwargs):
        super().__init__(message, status_code=409, error_code="SCAN_ALREADY_RUNNING", **kwargs)


class ScanNotFoundException(ScanException):
    """Scan not found"""
    
    def __init__(self, message: str = "Không tìm thấy scan", **kwargs):
        super().__init__(message, status_code=404, error_code="SCAN_NOT_FOUND", **kwargs)


class ScanFailedException(ScanException):
    """Scan execution failed"""
    
    def __init__(self, message: str = "Scan thất bại", **kwargs):
        super().__init__(message, status_code=500, error_code="SCAN_FAILED", **kwargs)


# Validation Exceptions
class ValidationException(SecureScanException):
    """Validation related exceptions"""
    
    def __init__(self, message: str = "Dữ liệu không hợp lệ", **kwargs):
        super().__init__(message, error_code="VALIDATION_ERROR", **kwargs)


# Resource Exceptions
class ResourceNotFoundException(SecureScanException):
    """Resource not found"""
    
    def __init__(self, message: str = "Không tìm thấy tài nguyên", **kwargs):
        super().__init__(message, status_code=404, error_code="RESOURCE_NOT_FOUND", **kwargs)


class PermissionDeniedException(SecureScanException):
    """Permission denied"""
    
    def __init__(self, message: str = "Không có quyền truy cập", **kwargs):
        super().__init__(message, status_code=403, error_code="PERMISSION_DENIED", **kwargs)


# Rate Limiting Exceptions
class RateLimitExceededException(SecureScanException):
    """Rate limit exceeded"""
    
    def __init__(self, message: str = "Quá nhiều yêu cầu, vui lòng thử lại sau", **kwargs):
        super().__init__(message, status_code=429, error_code="RATE_LIMIT_EXCEEDED", **kwargs)


# External Service Exceptions
class ExternalServiceException(SecureScanException):
    """External service error"""
    
    def __init__(self, message: str = "Lỗi dịch vụ bên ngoài", **kwargs):
        super().__init__(message, status_code=502, error_code="EXTERNAL_SERVICE_ERROR", **kwargs)


# Payment Exceptions
class PaymentException(SecureScanException):
    """Payment related exceptions"""
    
    def __init__(self, message: str = "Lỗi thanh toán", **kwargs):
        super().__init__(message, status_code=402, error_code="PAYMENT_ERROR", **kwargs)


class SubscriptionExpiredException(PaymentException):
    """Subscription expired"""
    
    def __init__(self, message: str = "Gói dịch vụ đã hết hạn", **kwargs):
        super().__init__(message, error_code="SUBSCRIPTION_EXPIRED", **kwargs)