# Production Deployment Guide - SecureScan.vn

## Kiến trúc Multi-tenant cho OWASP ZAP

### 🏗️ Tổng quan Kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer (Nginx)                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                    Frontend (Next.js)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                   Backend API (FastAPI)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                  ZAP Load Balancer                             │
│                     (HAProxy)                                  │
└─────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┘
      │         │         │         │         │         │
   ┌──▼──┐   ┌──▼──┐   ┌──▼──┐   ┌──▼──┐   ┌──▼──┐   ┌──▼──┐
   │ZAP-1│   │ZAP-2│   │ZAP-3│   │ZAP-4│   │ZAP-5│   │ZAP-N│
   └─────┘   └─────┘   └─────┘   └─────┘   └─────┘   └─────┘
```

### 📊 Khả năng Scale

#### Với 1000 người dùng đồng thời:
- **ZAP Instances**: 10-20 instances
- **Memory per ZAP**: 2-4GB
- **CPU per ZAP**: 2 cores
- **Total Resources**: 40-80GB RAM, 40 CPU cores

#### Với 10,000 người dùng đồng thời:
- **ZAP Instances**: 50-100 instances
- **Kubernetes Cluster**: 10-20 nodes
- **Auto-scaling**: HPA + VPA
- **Total Resources**: 200-400GB RAM, 200 CPU cores

## 🚀 Deployment Options

### Option 1: Docker Compose (Nhỏ - Vừa)

```bash
# Cho 100-1000 users
docker-compose -f docker-compose.production.yml up -d

# Scaling ZAP instances
docker-compose -f docker-compose.production.yml up -d --scale zap-1=3 --scale zap-2=3
```

### Option 2: Kubernetes (Lớn)

```bash
# Deploy ZAP cluster
kubectl apply -f k8s/zap-deployment.yaml

# Scale ZAP instances
kubectl scale deployment zap-cluster --replicas=20
```

### Option 3: Cloud Managed (Enterprise)

#### AWS ECS + Fargate:
```yaml
# ecs-task-definition.json
{
  "family": "securescan-zap",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "zap",
      "image": "owasp/zap2docker-stable",
      "memory": 4096,
      "cpu": 2048,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ]
    }
  ]
}
```

#### Google Cloud Run:
```yaml
# cloud-run-zap.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: securescan-zap
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "3"
        autoscaling.knative.dev/maxScale: "100"
    spec:
      containers:
      - image: owasp/zap2docker-stable
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
```

## 🔧 Configuration cho Production

### Environment Variables:

```env
# ZAP Pool Configuration
ZAP_POOL_ENABLED=true
ZAP_MIN_INSTANCES=5
ZAP_MAX_INSTANCES=50
ZAP_BASE_PORT=8080

# Load Balancing
ZAP_LB_STRATEGY=least_connections
ZAP_HEALTH_CHECK_INTERVAL=30

# Resource Limits
ZAP_MEMORY_LIMIT=4g
ZAP_CPU_LIMIT=2
MAX_CONCURRENT_SCANS=100

# Auto Scaling
ENABLE_AUTO_SCALING=true
SCALE_UP_THRESHOLD=70
SCALE_DOWN_THRESHOLD=30
```

### Database Configuration:

```env
# PostgreSQL Cluster
DATABASE_URL=postgresql://user:pass@postgres-cluster:5432/securescan
DATABASE_POOL_SIZE=50
DATABASE_MAX_OVERFLOW=100

# Redis Cluster
REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379
REDIS_SENTINEL_SERVICE=securescan-redis
```

## 📈 Monitoring và Alerting

### 1. Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'securescan-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    
  - job_name: 'zap-instances'
    static_configs:
      - targets: ['zap-1:8080', 'zap-2:8080', 'zap-3:8080']
    metrics_path: '/JSON/core/view/stats'
```

### 2. Grafana Dashboards

Key metrics để monitor:
- **ZAP Instance Health**: Uptime, response time
- **Scan Queue**: Queue size, processing rate
- **Resource Usage**: CPU, Memory, Disk
- **User Activity**: Active scans, completed scans
- **Error Rates**: Failed scans, timeouts

### 3. Alerting Rules

```yaml
# alerting-rules.yml
groups:
- name: securescan-alerts
  rules:
  - alert: ZAPInstanceDown
    expr: up{job="zap-instances"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "ZAP instance is down"
      
  - alert: HighScanQueue
    expr: scan_queue_size > 50
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Scan queue is getting large"
      
  - alert: HighMemoryUsage
    expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Container memory usage is high"
```

## 🔒 Security Considerations

### 1. Network Security

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
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 8080
```

### 2. API Key Management

```bash
# Rotate API keys regularly
kubectl create secret generic zap-api-keys \
  --from-literal=primary-key=$(openssl rand -hex 32) \
  --from-literal=backup-key=$(openssl rand -hex 32)
```

### 3. Resource Isolation

```yaml
# Resource quotas
apiVersion: v1
kind: ResourceQuota
metadata:
  name: zap-quota
spec:
  hard:
    requests.cpu: "50"
    requests.memory: 100Gi
    limits.cpu: "100"
    limits.memory: 200Gi
    pods: "50"
```

## 🚀 Auto Scaling Strategies

### 1. Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: zap-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: zap-cluster
  minReplicas: 5
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: scan_queue_size
      target:
        type: AverageValue
        averageValue: "10"
```

### 2. Vertical Pod Autoscaler (VPA)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: zap-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: zap-cluster
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: zap
      maxAllowed:
        cpu: 4
        memory: 8Gi
      minAllowed:
        cpu: 1
        memory: 2Gi
```

### 3. Custom Metrics Scaling

```python
# Custom metrics for scaling
class ZAPScalingMetrics:
    def get_queue_size(self):
        return zap_pool_manager.scan_queue.qsize()
    
    def get_average_response_time(self):
        nodes = zap_load_balancer.nodes.values()
        return sum(n.response_time for n in nodes) / len(nodes)
    
    def should_scale_up(self):
        return (
            self.get_queue_size() > 20 or
            self.get_average_response_time() > 10.0
        )
```

## 💰 Cost Optimization

### 1. Spot Instances (AWS)

```yaml
# EKS Node Group with Spot Instances
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: securescan-cluster
nodeGroups:
- name: zap-spot-nodes
  instanceTypes: ["m5.large", "m5.xlarge", "m4.large"]
  spot: true
  minSize: 3
  maxSize: 50
  desiredCapacity: 10
```

### 2. Preemptible VMs (GCP)

```yaml
# GKE Node Pool with Preemptible VMs
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: zap-preemptible-pool
spec:
  nodeConfig:
    preemptible: true
    machineType: n1-standard-2
  autoscaling:
    minNodeCount: 3
    maxNodeCount: 50
```

### 3. Resource Right-sizing

```bash
# Monitor resource usage
kubectl top pods -l app=zap
kubectl describe hpa zap-hpa

# Adjust resource requests/limits based on actual usage
```

## 📊 Performance Benchmarks

### Expected Performance:

| Users | ZAP Instances | Concurrent Scans | Response Time | Resource Usage |
|-------|---------------|------------------|---------------|----------------|
| 100   | 3-5           | 10-15           | < 2s          | 15GB RAM       |
| 500   | 10-15         | 50-75           | < 3s          | 60GB RAM       |
| 1000  | 20-30         | 100-150         | < 5s          | 120GB RAM      |
| 5000  | 50-75         | 250-375         | < 8s          | 300GB RAM      |
| 10000 | 100-150       | 500-750         | < 10s         | 600GB RAM      |

### Load Testing:

```bash
# Artillery.js load test
artillery run load-test.yml

# K6 load test
k6 run --vus 1000 --duration 10m scan-load-test.js
```

## 🔄 Deployment Pipeline

### 1. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Build and Push Images
      run: |
        docker build -t securescan/backend:${{ github.sha }} ./backend
        docker build -t securescan/frontend:${{ github.sha }} ./frontend
        docker push securescan/backend:${{ github.sha }}
        docker push securescan/frontend:${{ github.sha }}
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/backend backend=securescan/backend:${{ github.sha }}
        kubectl set image deployment/frontend frontend=securescan/frontend:${{ github.sha }}
        kubectl rollout status deployment/backend
        kubectl rollout status deployment/frontend
```

### 2. Blue-Green Deployment

```bash
# Deploy to green environment
kubectl apply -f k8s/green-deployment.yaml

# Switch traffic
kubectl patch service securescan-service -p '{"spec":{"selector":{"version":"green"}}}'

# Cleanup blue environment
kubectl delete -f k8s/blue-deployment.yaml
```

## 🎯 Kết luận

Với kiến trúc multi-tenant này, SecureScan.vn có thể:

✅ **Scale từ 100 đến 10,000+ users đồng thời**
✅ **Auto-scaling dựa trên load thực tế**
✅ **High availability với multiple ZAP instances**
✅ **Cost optimization với spot instances**
✅ **Monitoring và alerting toàn diện**
✅ **Security isolation giữa các scans**

### Next Steps:
1. **Implement load balancer** cho ZAP instances
2. **Setup monitoring** với Prometheus + Grafana
3. **Configure auto-scaling** policies
4. **Deploy to staging** environment để test
5. **Performance testing** với expected load
6. **Production deployment** với gradual rollout

Kiến trúc này đảm bảo SecureScan.vn có thể phục vụ hàng nghìn người dùng đồng thời mà không cần tạo VM riêng cho từng user!