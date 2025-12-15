# OWASP ZAP Integration Guide - SecureScan.vn

## 🎯 Tổng quan

SecureScan.vn sử dụng OWASP ZAP (Zed Attack Proxy) làm engine chính để quét bảo mật website. Hệ thống được thiết kế với kiến trúc multi-tenant, cho phép phục vụ hàng nghìn người dùng đồng thời mà không cần tạo VM riêng cho từng user.

## 🏗️ Kiến trúc Multi-tenant

### Single Instance Mode (Development)
```
User Request → FastAPI Backend → Single ZAP Instance → Scan Results
```

### Cluster Mode (Production)
```
User Request → FastAPI Backend → ZAP Load Balancer → ZAP Pool Manager → Multiple ZAP Instances
                                      ↓
                               Real-time WebSocket Updates
```

## 🔧 Components

### 1. ZAP Service (`zap_service.py`)
- **Chức năng**: Interface cơ bản để tương tác với OWASP ZAP API
- **Features**:
  - Health check ZAP instance
  - Start/stop scans
  - Get scan progress
  - Retrieve scan results
  - Parse vulnerabilities

### 2. ZAP Load Balancer (`zap_load_balancer.py`)
- **Chức năng**: Phân phối scans across multiple ZAP instances
- **Strategies**:
  - Round Robin
  - Least Connections (default)
  - Weighted Round Robin
  - Random
- **Features**:
  - Auto node discovery (Kubernetes/Docker)
  - Health monitoring
  - Load scoring algorithm

### 3. ZAP Pool Manager (`zap_pool_manager.py`)
- **Chức năng**: Quản lý lifecycle của ZAP instances
- **Features**:
  - Auto-scaling (min/max instances)
  - Queue management
  - Instance health monitoring
  - Docker container management
  - Resource cleanup

### 4. WebSocket Integration (`websocket.py`)
- **Chức năng**: Real-time scan progress updates
- **Features**:
  - Live progress tracking
  - Multi-user support
  - Connection management
  - Error handling

### 5. Admin Dashboard
- **Frontend**: React components for monitoring
- **Backend**: Admin API endpoints
- **Features**:
  - Cluster status monitoring
  - Node management
  - Performance metrics
  - System statistics

## 🚀 Setup và Configuration

### Development Setup

1. **Start ZAP Instance**:
```bash
# Using Docker
docker run -d --name zap \
  -p 8080:8080 \
  owasp/zap2docker-stable \
  zap.sh -daemon -host 0.0.0.0 -port 8080 \
  -config api.key=securescan-zap-key

# Or using script
./scripts/start-zap.sh start
```

2. **Configure Environment**:
```env
# Single instance mode
ZAP_POOL_ENABLED=false
ZAP_HOST=localhost
ZAP_PORT=8080
ZAP_API_KEY=securescan-zap-key

# Pool mode
ZAP_POOL_ENABLED=true
ZAP_MIN_INSTANCES=2
ZAP_MAX_INSTANCES=10
ZAP_BASE_PORT=8080
```

3. **Start Development Environment**:
```bash
./scripts/dev-start.sh
```

### Production Setup

1. **Docker Compose**:
```bash
# Start full cluster
docker-compose -f docker-compose.production.yml up -d

# Scale ZAP instances
docker-compose -f docker-compose.production.yml up -d --scale zap-1=5
```

2. **Kubernetes**:
```bash
# Deploy ZAP cluster
kubectl apply -f k8s/zap-deployment.yaml

# Scale instances
kubectl scale deployment zap-cluster --replicas=20
```

## 📊 Monitoring và Management

### Admin Dashboard

Access: `http://localhost:3000/admin`

**Features**:
- System overview
- ZAP cluster status
- Node management
- Performance metrics
- Real-time monitoring

### API Endpoints

```bash
# Get cluster status
GET /api/v1/admin/zap/cluster-status

# Add ZAP node
POST /api/v1/admin/zap/add-node
{
  "host": "192.168.1.100",
  "port": 8080,
  "api_key": "securescan-zap-key",
  "weight": 2
}

# Remove ZAP node
DELETE /api/v1/admin/zap/remove-node/{node_id}

# System statistics
GET /api/v1/admin/system/stats
```

### WebSocket Real-time Updates

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/scan-progress?token=JWT_TOKEN');

// Subscribe to scan updates
ws.send(JSON.stringify({
  type: 'subscribe_scan',
  scan_id: 'scan-uuid'
}));

// Receive updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'scan_update') {
    console.log('Progress:', message.data.progress);
  }
};
```

## 🧪 Testing

### Integration Tests

```bash
# Run ZAP integration tests
python scripts/test-zap-integration.py

# Test specific components
python -m pytest backend/tests/test_zap_integration.py
```

### Load Testing

```bash
# Artillery.js
artillery run load-tests/zap-load-test.yml

# K6
k6 run --vus 100 --duration 5m load-tests/scan-load-test.js
```

## 📈 Performance Tuning

### ZAP Instance Configuration

```bash
# Memory optimization
-Xmx4g -XX:+UseG1GC

# Thread configuration
-config spider.maxChildren=10
-config scanner.maxHostsPerScan=5
```

### Load Balancer Tuning

```python
# Adjust health check interval
health_check_interval = 30  # seconds

# Configure load balancing strategy
strategy = LoadBalancingStrategy.LEAST_CONNECTIONS

# Set node weights
node.weight = 2  # Higher weight = more scans
```

### Auto-scaling Configuration

```python
# Pool manager settings
min_instances = 5
max_instances = 50
scale_up_threshold = 70  # CPU %
scale_down_threshold = 30  # CPU %
```

## 🔒 Security Considerations

### API Key Management

```bash
# Generate secure API keys
openssl rand -hex 32

# Rotate keys regularly
kubectl create secret generic zap-api-keys \
  --from-literal=key=$(openssl rand -hex 32)
```

### Network Security

```yaml
# Network policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: zap-network-policy
spec:
  podSelector:
    matchLabels:
      app: zap
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
```

### Resource Isolation

```yaml
# Resource limits
resources:
  limits:
    memory: "4Gi"
    cpu: "2"
  requests:
    memory: "2Gi"
    cpu: "1"
```

## 🚨 Troubleshooting

### Common Issues

1. **ZAP Instance Not Starting**:
```bash
# Check Docker logs
docker logs securescan_zap

# Check port availability
netstat -tulpn | grep 8080

# Restart ZAP
./scripts/start-zap.sh restart
```

2. **Load Balancer Issues**:
```bash
# Check node health
curl http://localhost:8080/JSON/core/view/version/?apikey=securescan-zap-key

# Check cluster status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/zap/cluster-status
```

3. **WebSocket Connection Issues**:
```bash
# Check WebSocket endpoint
wscat -c "ws://localhost:8000/api/v1/ws/scan-progress?token=$TOKEN"

# Check connection manager
python -c "from app.api.v1.endpoints.websocket import manager; print(manager.active_connections)"
```

### Debug Mode

```python
# Enable debug logging
import logging
logging.getLogger('app.services.zap_service').setLevel(logging.DEBUG)

# Check ZAP service health
from app.services.zap_service import ZAPService
zap = ZAPService()
print(await zap.health_check())
```

## 📚 API Reference

### ZAP Service Methods

```python
class ZAPService:
    async def health_check() -> bool
    async def get_version() -> dict
    async def start_scan(url: str, options: dict) -> dict
    async def get_scan_progress(spider_id: str, active_id: str) -> dict
    async def get_scan_results(url: str) -> dict
    async def stop_scan(scan_id: str) -> bool
```

### Load Balancer Methods

```python
class ZAPLoadBalancer:
    async def start()
    async def stop()
    async def get_best_node() -> ZAPNode
    async def assign_scan(scan_id: str) -> ZAPNode
    async def release_scan(node_id: str, scan_id: str)
    def get_cluster_status() -> dict
```

### Pool Manager Methods

```python
class ZAPPoolManager:
    async def start()
    async def stop()
    async def submit_scan(scan_request: dict) -> str
    async def get_available_instance() -> ZAPInstance
    def get_pool_status() -> dict
```

## 🎯 Best Practices

### Development

1. **Always test ZAP connectivity** before starting scans
2. **Use health checks** to ensure ZAP availability
3. **Handle timeouts gracefully** in scan operations
4. **Monitor resource usage** during development

### Production

1. **Use multiple ZAP instances** for high availability
2. **Implement proper monitoring** and alerting
3. **Set resource limits** to prevent resource exhaustion
4. **Use auto-scaling** to handle load spikes
5. **Regular health checks** and failover mechanisms

### Security

1. **Rotate API keys** regularly
2. **Use network policies** to restrict access
3. **Monitor scan activities** for abuse
4. **Implement rate limiting** per user/IP

## 🔄 Maintenance

### Regular Tasks

```bash
# Weekly: Update ZAP Docker images
docker pull owasp/zap2docker-stable

# Monthly: Clean up old scan data
python scripts/cleanup-old-scans.py

# Daily: Check cluster health
curl -s http://localhost:8000/api/v1/admin/zap/cluster-status | jq '.data.healthy_nodes'
```

### Backup and Recovery

```bash
# Backup ZAP configurations
docker exec zap tar -czf /tmp/zap-config.tar.gz /zap/config

# Restore configurations
docker cp zap:/tmp/zap-config.tar.gz ./backups/
```

## 📞 Support

- **Documentation**: `/docs/OWASP-ZAP-INTEGRATION.md`
- **API Docs**: `http://localhost:8000/docs`
- **Admin Panel**: `http://localhost:3000/admin`
- **Logs**: `tail -f logs/backend.log`

---

**Lưu ý**: Tài liệu này được cập nhật thường xuyên. Vui lòng check version mới nhất trên repository.