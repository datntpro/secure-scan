"""
OWASP ZAP Integration Service
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, List, Any, Optional
from urllib.parse import urljoin, urlparse
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class ZAPService:
    """OWASP ZAP integration service"""
    
    def __init__(self):
        self.zap_host = settings.ZAP_HOST
        self.zap_port = settings.ZAP_PORT
        self.zap_api_key = settings.ZAP_API_KEY
        self.base_url = f"http://{self.zap_host}:{self.zap_port}"
        
    async def start_scan(self, target_url: str, scan_options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Start a new scan"""
        try:
            # Validate target URL
            parsed_url = urlparse(target_url)
            if not parsed_url.scheme or not parsed_url.netloc:
                raise ValueError("Invalid target URL")
            
            # Initialize scan options
            options = scan_options or {}
            scan_type = options.get('scan_type', 'full')
            
            # Start spider scan first
            spider_scan_id = await self._start_spider_scan(target_url)
            
            # Wait for spider to complete
            await self._wait_for_spider_completion(spider_scan_id)
            
            # Start active scan
            active_scan_id = await self._start_active_scan(target_url, options)
            
            return {
                "spider_scan_id": spider_scan_id,
                "active_scan_id": active_scan_id,
                "target_url": target_url,
                "scan_type": scan_type,
                "status": "started"
            }
            
        except Exception as e:
            logger.error(f"Failed to start ZAP scan: {e}")
            raise
    
    async def get_scan_progress(self, spider_scan_id: str, active_scan_id: str) -> Dict[str, Any]:
        """Get scan progress"""
        try:
            # Get spider progress
            spider_progress = await self._get_spider_progress(spider_scan_id)
            
            # Get active scan progress
            active_progress = await self._get_active_scan_progress(active_scan_id)
            
            # Calculate overall progress
            spider_weight = 0.3  # Spider takes 30% of total time
            active_weight = 0.7   # Active scan takes 70% of total time
            
            overall_progress = int(
                (spider_progress * spider_weight) + (active_progress * active_weight)
            )
            
            # Determine status
            status = "running"
            if spider_progress == 100 and active_progress == 100:
                status = "completed"
            elif spider_progress == -1 or active_progress == -1:
                status = "failed"
            
            return {
                "overall_progress": overall_progress,
                "spider_progress": spider_progress,
                "active_progress": active_progress,
                "status": status
            }
            
        except Exception as e:
            logger.error(f"Failed to get scan progress: {e}")
            return {
                "overall_progress": 0,
                "spider_progress": 0,
                "active_progress": 0,
                "status": "failed",
                "error": str(e)
            }
    
    async def get_scan_results(self, target_url: str) -> Dict[str, Any]:
        """Get scan results and vulnerabilities"""
        try:
            # Get alerts (vulnerabilities)
            alerts = await self._get_alerts(target_url)
            
            # Process and categorize alerts
            vulnerabilities = []
            severity_counts = {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
                "info": 0
            }
            
            for alert in alerts:
                severity = self._map_zap_risk_to_severity(alert.get('risk', 'Low'))
                severity_counts[severity] += 1
                
                vulnerability = {
                    "title": alert.get('name', 'Unknown Vulnerability'),
                    "description": alert.get('description', ''),
                    "severity": severity,
                    "confidence": alert.get('confidence', 'Medium'),
                    "cvss_score": self._calculate_cvss_score(severity, alert.get('confidence', 'Medium')),
                    "cwe_id": alert.get('cweid'),
                    "wasc_id": alert.get('wascid'),
                    "affected_url": alert.get('url', target_url),
                    "method": alert.get('method', 'GET'),
                    "parameter": alert.get('param', ''),
                    "attack": alert.get('attack', ''),
                    "evidence": alert.get('evidence', ''),
                    "other_info": alert.get('otherinfo', ''),
                    "solution": alert.get('solution', ''),
                    "reference": alert.get('reference', ''),
                    "plugin_id": alert.get('pluginId'),
                    "alert_ref": alert.get('alertRef')
                }
                vulnerabilities.append(vulnerability)
            
            # Calculate risk score
            risk_score = self._calculate_risk_score(severity_counts)
            
            return {
                "vulnerabilities": vulnerabilities,
                "severity_counts": severity_counts,
                "total_vulnerabilities": len(vulnerabilities),
                "risk_score": risk_score,
                "scan_summary": {
                    "target_url": target_url,
                    "scan_completed_at": time.time(),
                    "total_alerts": len(alerts)
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get scan results: {e}")
            raise
    
    async def stop_scan(self, spider_scan_id: str, active_scan_id: str) -> bool:
        """Stop running scans"""
        try:
            # Stop spider scan
            await self._stop_spider_scan(spider_scan_id)
            
            # Stop active scan
            await self._stop_active_scan(active_scan_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to stop scans: {e}")
            return False
    
    async def _start_spider_scan(self, target_url: str) -> str:
        """Start spider scan"""
        params = {
            'apikey': self.zap_api_key,
            'url': target_url,
            'maxChildren': '10',
            'recurse': 'true',
            'contextName': '',
            'subtreeOnly': 'false'
        }
        
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/JSON/spider/action/scan/"
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data['scan']
                else:
                    raise Exception(f"Failed to start spider scan: {response.status}")
    
    async def _start_active_scan(self, target_url: str, options: Dict[str, Any]) -> str:
        """Start active scan"""
        params = {
            'apikey': self.zap_api_key,
            'url': target_url,
            'recurse': 'true',
            'inScopeOnly': 'false',
            'scanPolicyName': '',
            'method': 'GET',
            'postData': ''
        }
        
        # Add scan options
        if options.get('scan_policy'):
            params['scanPolicyName'] = options['scan_policy']
        
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/JSON/ascan/action/scan/"
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data['scan']
                else:
                    raise Exception(f"Failed to start active scan: {response.status}")
    
    async def _get_spider_progress(self, scan_id: str) -> int:
        """Get spider scan progress"""
        params = {
            'apikey': self.zap_api_key,
            'scanId': scan_id
        }
        
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/JSON/spider/view/status/"
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return int(data['status'])
                else:
                    return -1
    
    async def _get_active_scan_progress(self, scan_id: str) -> int:
        """Get active scan progress"""
        params = {
            'apikey': self.zap_api_key,
            'scanId': scan_id
        }
        
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/JSON/ascan/view/status/"
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return int(data['status'])
                else:
                    return -1
    
    async def _wait_for_spider_completion(self, scan_id: str, timeout: int = 300):
        """Wait for spider scan to complete"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            progress = await self._get_spider_progress(scan_id)
            if progress == 100:
                break
            elif progress == -1:
                raise Exception("Spider scan failed")
            
            await asyncio.sleep(5)  # Check every 5 seconds
        
        if time.time() - start_time >= timeout:
            raise Exception("Spider scan timeout")
    
    async def _get_alerts(self, target_url: str) -> List[Dict[str, Any]]:
        """Get all alerts for target URL"""
        params = {
            'apikey': self.zap_api_key,
            'baseurl': target_url,
            'start': '0',
            'count': '1000'
        }
        
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/JSON/core/view/alerts/"
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data['alerts']
                else:
                    raise Exception(f"Failed to get alerts: {response.status}")
    
    async def _stop_spider_scan(self, scan_id: str):
        """Stop spider scan"""
        params = {
            'apikey': self.zap_api_key,
            'scanId': scan_id
        }
        
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/JSON/spider/action/stop/"
            async with session.get(url, params=params)
    
    async def _stop_active_scan(self, scan_id: str):
        """Stop active scan"""
        params = {
            'apikey': self.zap_api_key,
            'scanId': scan_id
        }
        
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/JSON/ascan/action/stop/"
            async with session.get(url, params=params)
    
    def _map_zap_risk_to_severity(self, zap_risk: str) -> str:
        """Map ZAP risk levels to our severity levels"""
        risk_mapping = {
            'High': 'high',
            'Medium': 'medium',
            'Low': 'low',
            'Informational': 'info'
        }
        return risk_mapping.get(zap_risk, 'low')
    
    def _calculate_cvss_score(self, severity: str, confidence: str) -> float:
        """Calculate CVSS score based on severity and confidence"""
        base_scores = {
            'critical': 9.0,
            'high': 7.0,
            'medium': 5.0,
            'low': 3.0,
            'info': 1.0
        }
        
        confidence_multiplier = {
            'High': 1.0,
            'Medium': 0.9,
            'Low': 0.8
        }
        
        base_score = base_scores.get(severity, 3.0)
        multiplier = confidence_multiplier.get(confidence, 0.9)
        
        return round(base_score * multiplier, 1)
    
    def _calculate_risk_score(self, severity_counts: Dict[str, int]) -> str:
        """Calculate overall risk score"""
        if severity_counts['critical'] > 0:
            return 'F'
        elif severity_counts['high'] >= 3:
            return 'D'
        elif severity_counts['high'] >= 1 or severity_counts['medium'] >= 5:
            return 'C'
        elif severity_counts['medium'] >= 1 or severity_counts['low'] >= 10:
            return 'B'
        else:
            return 'A'
    
    async def health_check(self) -> bool:
        """Check if ZAP is running and accessible"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/JSON/core/view/version/"
                params = {'apikey': self.zap_api_key}
                
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    return response.status == 200
        except:
            return False