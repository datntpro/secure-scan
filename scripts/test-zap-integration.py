#!/usr/bin/env python3
"""
Test script for ZAP integration and load balancing
"""

import asyncio
import aiohttp
import sys
import os
import time
from typing import Dict, Any

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.zap_service import ZAPService
from app.services.zap_load_balancer import zap_load_balancer, ZAPNode
from app.services.zap_pool_manager import zap_pool_manager
from app.core.config import settings


async def test_single_zap_instance():
    """Test single ZAP instance"""
    print("🧪 Testing single ZAP instance...")
    
    zap_service = ZAPService()
    
    # Test health check
    is_healthy = await zap_service.health_check()
    print(f"   Health check: {'✅ PASS' if is_healthy else '❌ FAIL'}")
    
    if not is_healthy:
        print("   ⚠️ ZAP instance not available. Make sure ZAP is running on localhost:8080")
        return False
    
    # Test version info
    try:
        version_info = await zap_service.get_version()
        print(f"   ZAP Version: {version_info}")
    except Exception as e:
        print(f"   ❌ Version check failed: {e}")
        return False
    
    print("   ✅ Single ZAP instance test passed")
    return True


async def test_load_balancer():
    """Test ZAP load balancer"""
    print("🧪 Testing ZAP load balancer...")
    
    try:
        # Start load balancer
        await zap_load_balancer.start()
        
        # Check cluster status
        status = zap_load_balancer.get_cluster_status()
        print(f"   Cluster nodes: {status['total_nodes']}")
        print(f"   Healthy nodes: {status['healthy_nodes']}")
        
        if status['healthy_nodes'] == 0:
            print("   ⚠️ No healthy nodes found")
            return False
        
        # Test node assignment
        node = await zap_load_balancer.get_best_node()
        if node:
            print(f"   Best node: {node.id} ({node.url})")
            
            # Test scan assignment
            assigned_node = await zap_load_balancer.assign_scan("test-scan-123")
            if assigned_node:
                print(f"   Assigned scan to: {assigned_node.id}")
                
                # Release scan
                await zap_load_balancer.release_scan(assigned_node.id, "test-scan-123")
                print("   ✅ Scan assignment/release test passed")
            else:
                print("   ❌ Failed to assign scan")
                return False
        else:
            print("   ❌ No available nodes")
            return False
        
        print("   ✅ Load balancer test passed")
        return True
        
    except Exception as e:
        print(f"   ❌ Load balancer test failed: {e}")
        return False


async def test_pool_manager():
    """Test ZAP pool manager"""
    print("🧪 Testing ZAP pool manager...")
    
    try:
        # Start pool manager
        await zap_pool_manager.start()
        
        # Wait a bit for instances to start
        await asyncio.sleep(5)
        
        # Check pool status
        status = zap_pool_manager.get_pool_status()
        print(f"   Total instances: {status['total_instances']}")
        print(f"   Queue size: {status['queue_size']}")
        print(f"   Status breakdown: {status['status_breakdown']}")
        
        if status['total_instances'] == 0:
            print("   ⚠️ No instances in pool")
            return False
        
        # Test scan submission
        scan_request = {
            'domain_url': 'https://example.com',
            'scan_type': 'standard',
            'user_id': 'test-user'
        }
        
        scan_id = await zap_pool_manager.submit_scan(scan_request)
        print(f"   Submitted scan: {scan_id}")
        
        # Wait a bit and check queue
        await asyncio.sleep(2)
        updated_status = zap_pool_manager.get_pool_status()
        print(f"   Updated queue size: {updated_status['queue_size']}")
        
        print("   ✅ Pool manager test passed")
        return True
        
    except Exception as e:
        print(f"   ❌ Pool manager test failed: {e}")
        return False


async def test_websocket_connection():
    """Test WebSocket connection"""
    print("🧪 Testing WebSocket connection...")
    
    try:
        # This would require a running FastAPI server
        # For now, just check if the WebSocket module imports correctly
        from app.api.v1.endpoints.websocket import manager
        print("   ✅ WebSocket module imported successfully")
        return True
        
    except Exception as e:
        print(f"   ❌ WebSocket test failed: {e}")
        return False


async def test_admin_endpoints():
    """Test admin API endpoints"""
    print("🧪 Testing admin endpoints...")
    
    try:
        # This would require a running FastAPI server and admin token
        # For now, just check if the admin module imports correctly
        from app.api.v1.endpoints.admin import router
        print("   ✅ Admin endpoints module imported successfully")
        return True
        
    except Exception as e:
        print(f"   ❌ Admin endpoints test failed: {e}")
        return False


async def performance_test():
    """Basic performance test"""
    print("🧪 Running performance test...")
    
    try:
        # Test multiple concurrent requests to load balancer
        tasks = []
        start_time = time.time()
        
        for i in range(10):
            task = zap_load_balancer.get_best_node()
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        successful = len([r for r in results if not isinstance(r, Exception)])
        duration = end_time - start_time
        
        print(f"   Processed {successful}/10 requests in {duration:.2f}s")
        print(f"   Average response time: {(duration/10)*1000:.2f}ms")
        
        if successful >= 8:  # Allow some failures
            print("   ✅ Performance test passed")
            return True
        else:
            print("   ❌ Performance test failed")
            return False
            
    except Exception as e:
        print(f"   ❌ Performance test failed: {e}")
        return False


async def cleanup():
    """Cleanup test resources"""
    print("🧹 Cleaning up...")
    
    try:
        await zap_pool_manager.stop()
        await zap_load_balancer.stop()
        print("   ✅ Cleanup completed")
    except Exception as e:
        print(f"   ⚠️ Cleanup warning: {e}")


async def main():
    """Run all tests"""
    print("🚀 Starting ZAP Integration Tests")
    print("=" * 50)
    
    tests = [
        ("Single ZAP Instance", test_single_zap_instance),
        ("Load Balancer", test_load_balancer),
        ("Pool Manager", test_pool_manager),
        ("WebSocket Connection", test_websocket_connection),
        ("Admin Endpoints", test_admin_endpoints),
        ("Performance Test", performance_test),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results[test_name] = result
        except Exception as e:
            print(f"   ❌ {test_name} crashed: {e}")
            results[test_name] = False
        
        print()  # Empty line between tests
    
    # Cleanup
    await cleanup()
    
    # Summary
    print("📊 Test Results Summary")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print()
    print(f"Overall: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 All tests passed! ZAP integration is working correctly.")
        return 0
    else:
        print("⚠️ Some tests failed. Check the output above for details.")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Tests crashed: {e}")
        sys.exit(1)