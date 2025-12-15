# ZAP Cloud Deployment Guide - SecureScan.vn

## 🌐 Cloud Deployment Options

### **1. AWS Deployment**

#### **EC2 + Auto Scaling Group**

```bash
# Launch Template
aws ec2 create-launch-template \
  --launch-template-name securescan-zap-template \
  --launch-template-data '{
    "ImageId": "ami-0c02fb55956c7d316",
    "InstanceType": "t3.medium",
    "SecurityGroupIds": ["sg-xxxxxxxxx"],
    "UserData": "'$(base64 -w 0 scripts/install-zap-vm.sh)'"
  }'

# Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name securescan-zap-asg \
  --launch-template LaunchTemplateName=securescan-zap-template,Version=1 \
  --min-size 2 \
  --max-size 20 \
  --desired-capacity 3 \
  --vpc-zone-identifier "subnet-xxxxxxxx,subnet-yyyyyyyy"
```

#### **ECS Fargate (Serverless)**

```yaml
# ecs-zap-task.json
{
  "family": "securescan-zap",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "zap",
      "image": "owasp/zap2docker-stable",
      "memory": 4096,
      "cpu": 2048,
      "essential": true,
      "command": [
        "zap.sh", "-daemon", "-host", "0.0.0.0", "-port", "8080",
        "-config", "api.addrs.addr.name=.*",
        "-config", "api.addrs.addr.regex=true",
        "-config", "api.key=securescan-zap-key"
      ],
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/securescan-zap",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### **Application Load Balancer**

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name securescan-zap-alb \
  --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-xxxxxxxxx

# Create Target Group
aws elbv2 create-target-group \
  --name securescan-zap-targets \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-xxxxxxxxx \
  --health-check-path "/JSON/core/view/version/" \
  --health-check-query-string "apikey=securescan-zap-key"
```

### **2. Google Cloud Platform**

#### **GKE Deployment**

```yaml
# zap-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zap-cluster
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zap
  template:
    metadata:
      labels:
        app: zap
    spec:
      containers:
      - name: zap
        image: owasp/zap2docker-stable
        args:
        - zap.sh
        - -daemon
        - -host
        - 0.0.0.0
        - -port
        - "8080"
        - -config
        - api.addrs.addr.name=.*
        - -config
        - api.addrs.addr.regex=true
        - -config
        - api.key=securescan-zap-key
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        livenessProbe:
          httpGet:
            path: /JSON/core/view/version/
            port: 8080
            httpHeaders:
            - name: apikey
              value: securescan-zap-key
          initialDelaySeconds: 60
          periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: zap-service
spec:
  selector:
    app: zap
  ports:
  - port: 8080
    targetPort: 8080
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: zap-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: zap-cluster
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

#### **Cloud Run (Serverless)**

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: securescan-zap
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "3"
        autoscaling.knative.dev/maxScale: "100"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 10
      containers:
      - image: owasp/zap2docker-stable
        args:
        - zap.sh
        - -daemon
        - -host
        - 0.0.0.0
        - -port
        - "8080"
        - -config
        - api.key=securescan-zap-key
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
        env:
        - name: JAVA_OPTS
          value: "-Xmx3g -XX:+UseG1GC"
```

### **3. Azure Deployment**

#### **Container Instances**

```bash
# Create resource group
az group create --name securescan-rg --location southeastasia

# Create container group
az container create \
  --resource-group securescan-rg \
  --name securescan-zap \
  --image owasp/zap2docker-stable \
  --cpu 2 \
  --memory 4 \
  --ports 8080 \
  --ip-address Public \
  --command-line "zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.key=securescan-zap-key"
```

#### **AKS Deployment**

```bash
# Create AKS cluster
az aks create \
  --resource-group securescan-rg \
  --name securescan-aks \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Deploy ZAP
kubectl apply -f k8s/zap-deployment.yaml
```

### **4. Hetzner Cloud (Cost-effective cho VN)**

#### **Server Setup**

```bash
# Create servers via API
curl -X POST \
  -H "Authorization: Bearer $HETZNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "securescan-zap-1",
    "server_type": "cx21",
    "location": "fsn1",
    "image": "ubuntu-20.04",
    "user_data": "'$(base64 -w 0 scripts/install-zap-vm.sh)'"
  }' \
  https://api.hetzner.cloud/v1/servers
```

#### **Load Balancer**

```bash
# Create load balancer
curl -X POST \
  -H "Authorization: Bearer $HETZNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "lb11",
    "location": "fsn1",
    "name": "securescan-zap-lb",
    "public_interface": true,
    "services": [
      {
        "protocol": "http",
        "listen_port": 80,
        "destination_port": 8080,
        "health_check": {
          "protocol": "http",
          "port": 8080,
          "path": "/JSON/core/view/version/?apikey=securescan-zap-key"
        }
      }
    ]
  }' \
  https://api.hetzner.cloud/v1/load_balancers
```

## 💰 **Cost Comparison (Monthly)**

### **Small Scale (100-500 users)**

| Provider | Service | Specs | Cost (USD) | Cost (VND) |
|----------|---------|-------|------------|------------|
| AWS | t3.medium x3 | 2vCPU, 4GB | $90 | 2.2M |
| GCP | e2-standard-2 x3 | 2vCPU, 8GB | $85 | 2.1M |
| Azure | B2s x3 | 2vCPU, 4GB | $95 | 2.3M |
| Hetzner | CX21 x3 | 2vCPU, 4GB | $30 | 750K |

### **Medium Scale (1000-5000 users)**

| Provider | Service | Specs | Cost (USD) | Cost (VND) |
|----------|---------|-------|------------|------------|
| AWS | ECS Fargate | Auto-scale 5-20 | $300 | 7.4M |
| GCP | GKE Autopilot | Auto-scale 5-20 | $280 | 6.9M |
| Azure | ACI | Auto-scale 5-20 | $320 | 7.9M |
| Hetzner | CX31 x10 | 2vCPU, 8GB | $120 | 3M |

### **Large Scale (10000+ users)**

| Provider | Service | Specs | Cost (USD) | Cost (VND) |
|----------|---------|-------|------------|------------|
| AWS | EKS + Spot | Auto-scale 10-100 | $800 | 19.7M |
| GCP | GKE + Preemptible | Auto-scale 10-100 | $750 | 18.5M |
| Azure | AKS + Spot | Auto-scale 10-100 | $850 | 21M |
| Hetzner | CX41 x20 | 4vCPU, 16GB | $400 | 9.9M |

## 🚀 **Recommended Architecture cho SecureScan.vn**

### **Phase 1: MVP (0-1000 users)**
```
Hetzner CX21 x3 + Load Balancer
- Cost: ~750K VND/month
- 3 ZAP instances
- HAProxy load balancer
- Manual scaling
```

### **Phase 2: Growth (1000-10000 users)**
```
Hetzner CX31 x5-15 + Kubernetes
- Cost: ~2-5M VND/month
- Auto-scaling ZAP cluster
- Kubernetes orchestration
- Monitoring & alerting
```

### **Phase 3: Scale (10000+ users)**
```
Multi-cloud: Hetzner + AWS/GCP
- Cost: ~10-20M VND/month
- Global load balancing
- Multi-region deployment
- Advanced monitoring
```

## 🔧 **Backend Configuration cho Cloud**

### **Environment Variables**

```env
# Single VM deployment
ZAP_POOL_ENABLED=false
ZAP_HOST=your-vm-ip
ZAP_PORT=8080
ZAP_API_KEY=securescan-zap-key

# Load balanced deployment
ZAP_POOL_ENABLED=true
ZAP_LOAD_BALANCER_URL=http://your-lb-ip:8089
ZAP_API_KEY=securescan-zap-key

# Kubernetes deployment
ZAP_POOL_ENABLED=true
ZAP_SERVICE_NAME=zap-service
ZAP_NAMESPACE=securescan
ZAP_API_KEY=securescan-zap-key
```

### **Service Discovery**

```python
# Update zap_load_balancer.py for cloud deployment
async def _discover_cloud_nodes(self):
    """Discover ZAP nodes in cloud environment"""
    
    # AWS ELB Target Group
    if os.getenv('AWS_REGION'):
        await self._discover_aws_targets()
    
    # GCP Load Balancer
    elif os.getenv('GOOGLE_CLOUD_PROJECT'):
        await self._discover_gcp_backends()
    
    # Kubernetes Service
    elif os.path.exists('/var/run/secrets/kubernetes.io/serviceaccount'):
        await self._discover_kubernetes_nodes()
    
    # Static IP list (Hetzner, manual)
    else:
        await self._discover_static_nodes()
```

## 📊 **Monitoring Setup**

### **Prometheus Metrics**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'zap-instances'
    static_configs:
      - targets: 
        - 'zap-vm-1:8080'
        - 'zap-vm-2:8080'
        - 'zap-vm-3:8080'
    metrics_path: '/JSON/core/view/stats'
    params:
      apikey: ['securescan-zap-key']
```

### **Grafana Dashboard**

```json
{
  "dashboard": {
    "title": "SecureScan ZAP Cluster",
    "panels": [
      {
        "title": "ZAP Instance Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"zap-instances\"}"
          }
        ]
      },
      {
        "title": "Active Scans",
        "type": "graph",
        "targets": [
          {
            "expr": "zap_active_scans_total"
          }
        ]
      }
    ]
  }
}
```

## 🛡️ **Security Best Practices**

### **Network Security**

```bash
# Firewall rules (iptables)
iptables -A INPUT -p tcp --dport 8080 -s YOUR_BACKEND_IP -j ACCEPT
iptables -A INPUT -p tcp --dport 8080 -j DROP

# Security groups (AWS)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 8080 \
  --source-group sg-backend-xxxxxxxxx
```

### **API Key Rotation**

```bash
# Rotate ZAP API keys
NEW_KEY=$(openssl rand -hex 32)

# Update all ZAP instances
for instance in zap-1 zap-2 zap-3; do
  ssh $instance "sudo systemctl stop zap@8080"
  ssh $instance "sed -i 's/old-key/$NEW_KEY/g' /etc/systemd/system/zap@.service"
  ssh $instance "sudo systemctl daemon-reload && sudo systemctl start zap@8080"
done
```

## 🎯 **Deployment Checklist**

### **Pre-deployment**
- [ ] Choose cloud provider
- [ ] Setup VMs/containers
- [ ] Configure networking
- [ ] Install ZAP instances
- [ ] Setup load balancer
- [ ] Configure monitoring

### **Post-deployment**
- [ ] Test ZAP connectivity
- [ ] Verify load balancing
- [ ] Check health monitoring
- [ ] Test auto-scaling
- [ ] Setup alerting
- [ ] Document access details

### **Ongoing Maintenance**
- [ ] Monitor resource usage
- [ ] Update ZAP versions
- [ ] Rotate API keys
- [ ] Scale based on demand
- [ ] Backup configurations
- [ ] Review security logs

---

**Khuyến nghị**: Bắt đầu với Hetzner Cloud cho cost-effectiveness, sau đó migrate lên AWS/GCP khi scale lớn hơn.