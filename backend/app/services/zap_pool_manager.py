"""
OWASP ZAP Pool Manager for Multi-tenant Architecture
"""

import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import time
import uuid
from concurrent.futures import ThreadPoolExecutor

from app.core.config import settings
from app.services.zap_service import ZAPService

logger = logging.getLogger(__name__)


class ZAPInstanceStatus(Enum):
    IDLE = "idle"
    BUSY = "busy"
    UNHEALTHY = "unhealthy"
    STARTING = "starting"


@dataclass
class ZAPInstance:
    """ZAP instance configuration"""
    id: str
    host: str
    port: int
    api_key: str
    status: ZAPInstanceStatus
    current_scan_id: Optional[str] = None
    last_health_check: Optional[float] = None
    created_at: float = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = time.time()
    
    @property
    def url(self) -> str:
        return f"http://{self.host}:{self.port}"
    
    def is_healthy(self) -> bool:
        """Check if instance is healthy based on last health check"""
        if self.last_health_check is None:
            return False
        
        # Consider unhealthy if no health check in last 5 minutes
        return time.time() - self.last_health_check < 300


class ZAPPoolManager:
    """Manages a pool of ZAP instances for concurrent scanning"""
    
    def __init__(self):
        self.instances: Dict[str, ZAPInstance] = {}
        self.scan_queue: asyncio.Queue = asyncio.Queue()
        self.executor = ThreadPoolExecutor(max_workers=10)
        self._health_check_task: Optional[asyncio.Task] = None
        self._queue_processor_task: Optional[asyncio.Task] = None
        
        # Configuration
        self.min_instances = settings.ZAP_MIN_INSTANCES
        self.max_instances = settings.ZAP_MAX_INSTANCES
        self.base_port = settings.ZAP_BASE_PORT
        self.health_check_interval = 60  # seconds
        
    async def start(self):
        """Start the ZAP pool manager"""
        logger.info("Starting ZAP Pool Manager...")
        
        # Start initial instances
        await self._ensure_min_instances()
        
        # Start background tasks
        self._health_check_task = asyncio.create_task(self._health_check_loop())
        self._queue_processor_task = asyncio.create_task(self._process_scan_queue())
        
        logger.info(f"ZAP Pool Manager started with {len(self.instances)} instances")
    
    async def stop(self):
        """Stop the ZAP pool manager"""
        logger.info("Stopping ZAP Pool Manager...")
        
        # Cancel background tasks
        if self._health_check_task:
            self._health_check_task.cancel()
        if self._queue_processor_task:
            self._queue_processor_task.cancel()
        
        # Stop all ZAP instances
        for instance in self.instances.values():
            await self._stop_zap_instance(instance)
        
        self.instances.clear()
        logger.info("ZAP Pool Manager stopped")
    
    async def submit_scan(self, scan_request: Dict[str, Any]) -> str:
        """Submit a scan request to the queue"""
        scan_id = str(uuid.uuid4())
        scan_request['scan_id'] = scan_id
        
        await self.scan_queue.put(scan_request)
        logger.info(f"Scan {scan_id} submitted to queue")
        
        return scan_id
    
    async def get_available_instance(self) -> Optional[ZAPInstance]:
        """Get an available ZAP instance"""
        # Find idle instance
        for instance in self.instances.values():
            if instance.status == ZAPInstanceStatus.IDLE and instance.is_healthy():
                return instance
        
        # Try to create new instance if under limit
        if len(self.instances) < self.max_instances:
            instance = await self._create_zap_instance()
            if instance:
                return instance
        
        return None
    
    async def release_instance(self, instance_id: str):
        """Release a ZAP instance back to the pool"""
        if instance_id in self.instances:
            instance = self.instances[instance_id]
            instance.status = ZAPInstanceStatus.IDLE
            instance.current_scan_id = None
            logger.info(f"Released ZAP instance {instance_id}")
    
    async def get_instance_for_scan(self, scan_id: str) -> Optional[ZAPInstance]:
        """Get the ZAP instance handling a specific scan"""
        for instance in self.instances.values():
            if instance.current_scan_id == scan_id:
                return instance
        return None
    
    async def _ensure_min_instances(self):
        """Ensure minimum number of instances are running"""
        current_count = len([i for i in self.instances.values() 
                           if i.status != ZAPInstanceStatus.UNHEALTHY])
        
        needed = self.min_instances - current_count
        
        for _ in range(needed):
            await self._create_zap_instance()
    
    async def _create_zap_instance(self) -> Optional[ZAPInstance]:
        """Create a new ZAP instance"""
        try:
            # Find available port
            port = self._find_available_port()
            if not port:
                logger.error("No available ports for new ZAP instance")
                return None
            
            instance_id = f"zap-{port}"
            api_key = f"securescan-{instance_id}"
            
            # Create instance configuration
            instance = ZAPInstance(
                id=instance_id,
                host="localhost",
                port=port,
                api_key=api_key,
                status=ZAPInstanceStatus.STARTING
            )
            
            self.instances[instance_id] = instance
            
            # Start ZAP container/process
            success = await self._start_zap_instance(instance)
            
            if success:
                instance.status = ZAPInstanceStatus.IDLE
                logger.info(f"Created ZAP instance {instance_id} on port {port}")
                return instance
            else:
                del self.instances[instance_id]
                logger.error(f"Failed to start ZAP instance {instance_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating ZAP instance: {e}")
            return None
    
    def _find_available_port(self) -> Optional[int]:
        """Find an available port for new ZAP instance"""
        used_ports = {instance.port for instance in self.instances.values()}
        
        for port in range(self.base_port, self.base_port + 100):
            if port not in used_ports:
                return port
        
        return None
    
    async def _start_zap_instance(self, instance: ZAPInstance) -> bool:
        """Start a ZAP instance using Docker"""
        try:
            import docker
            
            client = docker.from_env()
            
            # ZAP container configuration
            container_name = f"securescan_{instance.id}"
            
            # Remove existing container if exists
            try:
                existing = client.containers.get(container_name)
                existing.remove(force=True)
            except docker.errors.NotFound:
                pass
            
            # Start new container
            container = client.containers.run(
                image="owasp/zap2docker-stable",
                name=container_name,
                ports={8080: instance.port},
                command=[
                    "zap.sh", "-daemon",
                    "-host", "0.0.0.0",
                    "-port", "8080",
                    "-config", "api.addrs.addr.name=.*",
                    "-config", "api.addrs.addr.regex=true",
                    "-config", f"api.key={instance.api_key}"
                ],
                detach=True,
                remove=True,
                mem_limit="2g",
                environment={
                    "JAVA_OPTS": "-Xmx1g"
                }
            )
            
            # Wait for ZAP to be ready
            for _ in range(60):  # Wait up to 60 seconds
                try:
                    zap_service = ZAPService()
                    zap_service.zap_host = instance.host
                    zap_service.zap_port = instance.port
                    zap_service.zap_api_key = instance.api_key
                    
                    if await zap_service.health_check():
                        instance.last_health_check = time.time()
                        return True
                        
                except Exception:
                    pass
                
                await asyncio.sleep(1)
            
            # If we get here, ZAP didn't start properly
            container.remove(force=True)
            return False
            
        except Exception as e:
            logger.error(f"Error starting ZAP instance {instance.id}: {e}")
            return False
    
    async def _stop_zap_instance(self, instance: ZAPInstance):
        """Stop a ZAP instance"""
        try:
            import docker
            
            client = docker.from_env()
            container_name = f"securescan_{instance.id}"
            
            try:
                container = client.containers.get(container_name)
                container.remove(force=True)
                logger.info(f"Stopped ZAP instance {instance.id}")
            except docker.errors.NotFound:
                pass
                
        except Exception as e:
            logger.error(f"Error stopping ZAP instance {instance.id}: {e}")
    
    async def _health_check_loop(self):
        """Background task to check health of all instances"""
        while True:
            try:
                await asyncio.sleep(self.health_check_interval)
                await self._perform_health_checks()
                await self._cleanup_unhealthy_instances()
                await self._ensure_min_instances()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in health check loop: {e}")
    
    async def _perform_health_checks(self):
        """Perform health checks on all instances"""
        tasks = []
        
        for instance in self.instances.values():
            if instance.status != ZAPInstanceStatus.STARTING:
                tasks.append(self._check_instance_health(instance))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _check_instance_health(self, instance: ZAPInstance):
        """Check health of a single instance"""
        try:
            zap_service = ZAPService()
            zap_service.zap_host = instance.host
            zap_service.zap_port = instance.port
            zap_service.zap_api_key = instance.api_key
            
            if await zap_service.health_check():
                instance.last_health_check = time.time()
                if instance.status == ZAPInstanceStatus.UNHEALTHY:
                    instance.status = ZAPInstanceStatus.IDLE
                    logger.info(f"ZAP instance {instance.id} recovered")
            else:
                instance.status = ZAPInstanceStatus.UNHEALTHY
                logger.warning(f"ZAP instance {instance.id} is unhealthy")
                
        except Exception as e:
            instance.status = ZAPInstanceStatus.UNHEALTHY
            logger.error(f"Health check failed for {instance.id}: {e}")
    
    async def _cleanup_unhealthy_instances(self):
        """Remove unhealthy instances that can't be recovered"""
        to_remove = []
        
        for instance_id, instance in self.instances.items():
            if (instance.status == ZAPInstanceStatus.UNHEALTHY and 
                instance.last_health_check and
                time.time() - instance.last_health_check > 300):  # 5 minutes
                
                to_remove.append(instance_id)
        
        for instance_id in to_remove:
            instance = self.instances[instance_id]
            await self._stop_zap_instance(instance)
            del self.instances[instance_id]
            logger.info(f"Removed unhealthy ZAP instance {instance_id}")
    
    async def _process_scan_queue(self):
        """Background task to process scan queue"""
        while True:
            try:
                # Get scan request from queue
                scan_request = await self.scan_queue.get()
                
                # Get available instance
                instance = await self.get_available_instance()
                
                if instance:
                    # Assign scan to instance
                    instance.status = ZAPInstanceStatus.BUSY
                    instance.current_scan_id = scan_request['scan_id']
                    
                    # Process scan in background
                    asyncio.create_task(
                        self._process_scan(instance, scan_request)
                    )
                else:
                    # No available instance, put back in queue
                    await self.scan_queue.put(scan_request)
                    await asyncio.sleep(5)  # Wait before retrying
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error processing scan queue: {e}")
    
    async def _process_scan(self, instance: ZAPInstance, scan_request: Dict[str, Any]):
        """Process a scan on a specific ZAP instance"""
        try:
            # Create ZAP service for this instance
            zap_service = ZAPService()
            zap_service.zap_host = instance.host
            zap_service.zap_port = instance.port
            zap_service.zap_api_key = instance.api_key
            
            # Execute scan
            # This would integrate with your existing scan logic
            logger.info(f"Processing scan {scan_request['scan_id']} on {instance.id}")
            
            # TODO: Integrate with actual scan processing
            # await process_actual_scan(zap_service, scan_request)
            
        except Exception as e:
            logger.error(f"Error processing scan on {instance.id}: {e}")
        finally:
            # Release instance
            await self.release_instance(instance.id)
    
    def get_pool_status(self) -> Dict[str, Any]:
        """Get current pool status"""
        status_counts = {}
        for status in ZAPInstanceStatus:
            status_counts[status.value] = len([
                i for i in self.instances.values() 
                if i.status == status
            ])
        
        return {
            "total_instances": len(self.instances),
            "status_breakdown": status_counts,
            "queue_size": self.scan_queue.qsize(),
            "instances": [
                {
                    "id": instance.id,
                    "port": instance.port,
                    "status": instance.status.value,
                    "current_scan": instance.current_scan_id,
                    "uptime": time.time() - instance.created_at
                }
                for instance in self.instances.values()
            ]
        }


# Global pool manager instance
zap_pool_manager = ZAPPoolManager()