"""
Domain service
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from typing import List, Optional, Dict, Any
import uuid
import secrets
import asyncio
import aiohttp
import dns.resolver
from urllib.parse import urlparse
from sqlalchemy.sql import func

from app.models.domain import Domain, DomainStatus, VerificationMethod
from app.models.user import User
from app.schemas.domain import DomainCreate, DomainUpdate
from app.core.exceptions import ValidationException, NotFoundException


class DomainService:
    """Domain management service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_domain(self, user_id: uuid.UUID, domain_data: DomainCreate) -> Domain:
        """Create new domain"""
        
        # Check if domain already exists for this user
        result = await self.db.execute(
            select(Domain).where(
                and_(
                    Domain.user_id == user_id,
                    Domain.url == str(domain_data.url)
                )
            )
        )
        existing_domain = result.scalar_one_or_none()
        
        if existing_domain:
            raise ValidationException("Domain này đã được thêm vào tài khoản của bạn")
        
        # Validate domain accessibility
        if not await self._is_domain_accessible(str(domain_data.url)):
            raise ValidationException("Không thể truy cập domain này. Vui lòng kiểm tra URL.")
        
        # Create domain
        domain = Domain(
            user_id=user_id,
            url=str(domain_data.url),
            description=domain_data.description,
            verification_token=secrets.token_urlsafe(32)
        )
        
        self.db.add(domain)
        await self.db.commit()
        await self.db.refresh(domain)
        
        return domain
    
    async def update_domain(self, user_id: uuid.UUID, domain_id: uuid.UUID, domain_data: DomainUpdate) -> Domain:
        """Update domain"""
        
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
        
        # Update fields
        if domain_data.description is not None:
            domain.description = domain_data.description
        if domain_data.auto_scan_enabled is not None:
            domain.auto_scan_enabled = domain_data.auto_scan_enabled
        if domain_data.auto_scan_frequency is not None:
            domain.auto_scan_frequency = domain_data.auto_scan_frequency
        if domain_data.notifications_enabled is not None:
            domain.notifications_enabled = domain_data.notifications_enabled
        
        await self.db.commit()
        await self.db.refresh(domain)
        
        return domain
    
    async def delete_domain(self, user_id: uuid.UUID, domain_id: uuid.UUID):
        """Delete domain"""
        
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
        
        await self.db.delete(domain)
        await self.db.commit()
    
    async def bulk_delete_domains(self, user_id: uuid.UUID, domain_ids: List[uuid.UUID]) -> int:
        """Delete multiple domains"""
        
        result = await self.db.execute(
            delete(Domain).where(
                and_(
                    Domain.id.in_(domain_ids),
                    Domain.user_id == user_id
                )
            )
        )
        
        await self.db.commit()
        return result.rowcount
    
    async def verify_domain(self, user_id: uuid.UUID, domain_id: uuid.UUID, method: VerificationMethod) -> bool:
        """Verify domain ownership"""
        
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
        
        if method == VerificationMethod.DNS_TXT:
            verified = await self._verify_dns_txt(domain)
        elif method == VerificationMethod.FILE_UPLOAD:
            verified = await self._verify_file_upload(domain)
        else:
            raise ValidationException("Phương thức xác minh không hợp lệ")
        
        if verified:
            domain.status = DomainStatus.VERIFIED
            domain.verification_method = method
            domain.verified_at = func.now()
        else:
            domain.status = DomainStatus.FAILED
        
        await self.db.commit()
        await self.db.refresh(domain)
        
        return verified
    
    async def get_verification_info(self, user_id: uuid.UUID, domain_id: uuid.UUID) -> Dict[str, Any]:
        """Get domain verification information"""
        
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
        
        hostname = urlparse(domain.url).netloc
        
        return {
            "domain_id": str(domain.id),
            "url": domain.url,
            "hostname": hostname,
            "status": domain.status,
            "verification_token": domain.verification_token,
            "verification_methods": {
                "dns_txt": {
                    "record_type": "TXT",
                    "record_name": "_securescan",
                    "record_value": f"securescan-verify-{domain.verification_token}",
                    "full_domain": f"_securescan.{hostname}"
                },
                "file_upload": {
                    "filename": "securescan-verify.txt",
                    "content": f"securescan-verify-{domain.verification_token}",
                    "upload_path": f"{domain.url}/securescan-verify.txt"
                }
            }
        }
    
    async def _is_domain_accessible(self, url: str) -> bool:
        """Check if domain is accessible"""
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.head(url) as response:
                    return response.status < 500
        except:
            return False
    
    async def _verify_dns_txt(self, domain: Domain) -> bool:
        """Verify domain via DNS TXT record"""
        try:
            hostname = urlparse(domain.url).netloc
            record_name = f"_securescan.{hostname}"
            expected_value = f"securescan-verify-{domain.verification_token}"
            
            # Query DNS TXT records
            resolver = dns.resolver.Resolver()
            resolver.timeout = 10
            resolver.lifetime = 10
            
            answers = resolver.resolve(record_name, 'TXT')
            
            for answer in answers:
                txt_value = answer.to_text().strip('"')
                if txt_value == expected_value:
                    return True
            
            return False
        except Exception as e:
            print(f"DNS verification error: {e}")
            return False
    
    async def _verify_file_upload(self, domain: Domain) -> bool:
        """Verify domain via file upload"""
        try:
            verification_url = f"{domain.url}/securescan-verify.txt"
            expected_content = f"securescan-verify-{domain.verification_token}"
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(verification_url) as response:
                    if response.status == 200:
                        content = await response.text()
                        return content.strip() == expected_content
            
            return False
        except Exception as e:
            print(f"File verification error: {e}")
            return False