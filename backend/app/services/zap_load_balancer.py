"""
ZAP Load Balancer for distributing scans across multiple instances
"""

import asyncio
import aiohttp
import logging
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
import time
import random
from enum import Enum

logger = logging.getLogger(__name__)


class LoadBalancingStrategy(Enum):
    ROUND_ROBIN = "round_robin"
    LEAST_CONNECTIONS = "least_connections"
    WEIGHTED_ROUND_ROBIN = "weighted_round_robin"
    RANDOM = "random"


@dataclass
class ZAPNode:
    """ZAP node in the cluster"""
    id: str
    host: str
    port: int
    api_key: str
    weight: int = 1
    active_scans: int = 0
    total_scans: int = 0
    last_health_check: Optional[float] = None
    response_time: float = 0.0
    is_healthy: bool = True
    
    @property
    def url(self) -> str:
        return f"http://{self.host}:{self.port}"
    
    def calculate_load_score(self) -> float:
        """Calculate load score for load balancing decisions"""
        # Lower score = less loaded
        base_score = self.active_scans / max(self.weight, 1)
        
        # Penalty for unhealthy nodes
        if not self.is_healthy:
            base_score += 1000
        
        # Penalty for slow response times
        if self.response_time > 5.0:
            base_score += self.response_time * 0.1
        
        return base_score


class ZAPLoadBalancer:
    """Load balancer for ZAP instances"""
    
    def __init__(self, strategy: LoadBalancingStrategy = LoadBalancingStrategy.LEAST_CONNECTIONS):
        self.nodes: Dict[str, ZAPNode] = {}
        self.strategy = strategy
        self.current_index = 0
        self.health_check_interval = 30
        self._health_check_task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start the load balancer"""
        logger.info("Starting ZAP Load Balancer...")
        
        # Discover ZAP nodes
        await self._discover_nodes()
        
        # Start health checking
        self._health_check_task = asyncio.create_task(self._health_check_loop())
        
        logger.info(f"ZAP Load Balancer started with {len(self.nodes)} nodes")
    
    async def stop(self):
        """Stop the load balancer"""
        if self._health_check_task:
            self._health_check_task.cancel()
        
        logger.info("ZAP Load Balancer stopped")
    
    def add_node(self, node: ZAPNode):
        """Add a ZAP node to the cluster"""
        self.nodes[node.id] = node
        logger.info(f"Added ZAP node {node.id} at {node.url}")
    
    def remove_node(self, node_id: str):
        """Remove a ZAP node from the cluster"""
        if node_id in self.nodes:
            del self.nodes[node_id]
            logger.info(f"Removed ZAP node {node_id}")
    
    async def get_best_node(self) -> Optional[ZAPNode]:
        """Get the best available ZAP node based on load balancing strategy"""
        healthy_nodes = [node for node in self.nodes.values() if node.is_healthy]
        
        if not healthy_nodes:
            logger.warning("No healthy ZAP nodes available")
            return None
        
        if self.strategy == LoadBalancingStrategy.ROUND_ROBIN:
            return self._round_robin_selection(healthy_nodes)
        elif self.strategy == LoadBalancingStrategy.LEAST_CONNECTIONS:
            return self._least_connections_selection(healthy_nodes)
        elif self.strategy == LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN:
            return self._weighted_round_robin_selection(healthy_nodes)
        elif self.strategy == LoadBalancingStrategy.RANDOM:
            return self._random_selection(healthy_nodes)
        else:
            return healthy_nodes[0]  # Fallback
    
    def _round_robin_selection(self, nodes: List[ZAPNode]) -> ZAPNode:
        """Round robin selection"""
        node = nodes[self.current_index % len(nodes)]
        self.current_index += 1
        return node
    
    def _least_connections_selection(self, nodes: List[ZAPNode]) -> ZAPNode:
        """Select node with least active connections"""
        return min(nodes, key=lambda n: n.calculate_load_score())
    
    def _weighted_round_robin_selection(self, nodes: List[ZAPNode]) -> ZAPNode:
        """Weighted round robin selection"""
        # Create weighted list
        weighted_nodes = []
        for node in nodes:
            weighted_nodes.extend([node] * node.weight)
        
        if not weighted_nodes:
            return nodes[0]
        
        node = weighted_nodes[self.current_index % len(weighted_nodes)]
        self.current_index += 1
        return node
    
    def _random_selection(self, nodes: List[ZAPNode]) -> ZAPNode:
        """Random selection with weight consideration"""
        weights = [node.weight for node in nodes]
        return random.choices(nodes, weights=weights)[0]
    
    async def assign_scan(self, scan_id: str) -> Optional[ZAPNode]:
        """Assign a scan to the best available node"""
        node = await self.get_best_node()
        
        if node:
            node.active_scans += 1
            node.total_scans += 1
            logger.info(f"Assigned scan {scan_id} to ZAP node {node.id}")
        
        return node
    
    async def release_scan(self, node_id: str, scan_id: str):
        """Release a scan from a node"""
        if node_id in self.nodes:
            node = self.nodes[node_id]
            node.active_scans = max(0, node.active_scans - 1)
            logger.info(f"Released scan {scan_id} from ZAP node {node_id}")
    
    async def _discover_nodes(self):
        """Discover ZAP nodes (Kubernetes service discovery)"""
        try:
            # In Kubernetes, discover via service
            if await self._is_kubernetes_environment():
                await self._discover_kubernetes_nodes()
            else:
                # Local development - single node
                await self._discover_local_nodes()
                
        except Exception as e:
            logger.error(f"Error discovering ZAP nodes: {e}")
    
    async def _is_kubernetes_environment(self) -> bool:
        """Check if running in Kubernetes"""
        try:
            import os
            return os.path.exists('/var/run/secrets/kubernetes.io/serviceaccount')
        except:
            return False
    
    async def _discover_kubernetes_nodes(self):
        """Discover ZAP nodes in Kubernetes cluster"""
        try:
            # Use Kubernetes API to discover ZAP pods
            from kubernetes import client, config
            
            # Load in-cluster config
            config.load_incluster_config()
            v1 = client.CoreV1Api()
            
            # Get ZAP service endpoints
            endpoints = v1.read_namespaced_endpoints(
                name="zap-service",
                namespace="securescan"
            )
            
            for subset in endpoints.subsets or []:
                for address in subset.addresses or []:
                    for port in subset.ports or []:
                        if port.name == "zap-api":
                            node = ZAPNode(
                                id=f"zap-{address.ip}-{port.port}",
                                host=address.ip,
                                port=port.port,
                                api_key="securescan-zap-key"
                            )
                            self.add_node(node)
                            
        except Exception as e:
            logger.error(f"Error discovering Kubernetes ZAP nodes: {e}")
            # Fallback to service discovery
            await self._discover_service_nodes()
    
    async def _discover_service_nodes(self):
        """Discover ZAP nodes via service discovery"""
        try:
            # Try to resolve ZAP service
            import socket
            
            # Get all IPs for zap-service
            try:
                ips = socket.gethostbyname_ex('zap-service')[2]
                for ip in ips:
                    node = ZAPNode(
                        id=f"zap-{ip}-8080",
                        host=ip,
                        port=8080,
                        api_key="securescan-zap-key"
                    )
                    self.add_node(node)
            except socket.gaierror:
                # Service not found, try localhost
                await self._discover_local_nodes()
                
        except Exception as e:
            logger.error(f"Error in service discovery: {e}")
            await self._discover_local_nodes()
    
    async def _discover_local_nodes(self):
        """Discover local ZAP nodes for development"""
        # Add default local node
        node = ZAPNode(
            id="zap-local-8080",
            host="localhost",
            port=8080,
            api_key="securescan-zap-key"
        )
        self.add_node(node)
        
        # Try to discover additional local instances
        for port in range(8081, 8090):
            try:
                async with aiohttp.ClientSession() as session:
                    url = f"http://localhost:{port}/JSON/core/view/version/"
                    params = {"apikey": "securescan-zap-key"}
                    
                    async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=2)) as response:
                        if response.status == 200:
                            node = ZAPNode(
                                id=f"zap-local-{port}",
                                host="localhost",
                                port=port,
                                api_key="securescan-zap-key"
                            )
                            self.add_node(node)
            except:
                continue
    
    async def _health_check_loop(self):
        """Background health checking loop"""
        while True:
            try:
                await asyncio.sleep(self.health_check_interval)
                await self._perform_health_checks()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in health check loop: {e}")
    
    async def _perform_health_checks(self):
        """Perform health checks on all nodes"""
        tasks = []
        for node in self.nodes.values():
            tasks.append(self._check_node_health(node))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _check_node_health(self, node: ZAPNode):
        """Check health of a single node"""
        try:
            start_time = time.time()
            
            async with aiohttp.ClientSession() as session:
                url = f"{node.url}/JSON/core/view/version/"
                params = {"apikey": node.api_key}
                
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    node.response_time = time.time() - start_time
                    node.last_health_check = time.time()
                    
                    if response.status == 200:
                        if not node.is_healthy:
                            logger.info(f"ZAP node {node.id} recovered")
                        node.is_healthy = True
                    else:
                        node.is_healthy = False
                        logger.warning(f"ZAP node {node.id} returned status {response.status}")
                        
        except Exception as e:
            node.is_healthy = False
            node.response_time = 10.0  # High penalty for failed requests
            logger.error(f"Health check failed for ZAP node {node.id}: {e}")
    
    def get_cluster_status(self) -> Dict[str, Any]:
        """Get cluster status information"""
        total_nodes = len(self.nodes)
        healthy_nodes = len([n for n in self.nodes.values() if n.is_healthy])
        total_active_scans = sum(n.active_scans for n in self.nodes.values())
        total_scans = sum(n.total_scans for n in self.nodes.values())
        
        return {
            "strategy": self.strategy.value,
            "total_nodes": total_nodes,
            "healthy_nodes": healthy_nodes,
            "unhealthy_nodes": total_nodes - healthy_nodes,
            "total_active_scans": total_active_scans,
            "total_scans_processed": total_scans,
            "nodes": [
                {
                    "id": node.id,
                    "url": node.url,
                    "is_healthy": node.is_healthy,
                    "active_scans": node.active_scans,
                    "total_scans": node.total_scans,
                    "response_time": node.response_time,
                    "weight": node.weight,
                    "load_score": node.calculate_load_score()
                }
                for node in self.nodes.values()
            ]
        }


# Global load balancer instance
zap_load_balancer = ZAPLoadBalancer(LoadBalancingStrategy.LEAST_CONNECTIONS)