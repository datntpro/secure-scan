# OWASP ZAP Integration Guide

## Tổng quan

SecureScan.vn tích hợp OWASP ZAP (Zed Attack Proxy) để thực hiện quét bảo mật website. ZAP là một công cụ mã nguồn mở được phát triển bởi OWASP, được sử dụng rộng rãi trong cộng đồng bảo mật.

## Cài đặt và Cấu hình

### 1. Cài đặt OWASP ZAP

#### Trên macOS:
```bash
# Sử dụng Homebrew
brew install --cask owasp-zap

# Hoặc tải từ trang chính thức
# https://www.zaproxy.org/download/
```

#### Trên Ubuntu/Debian:
```bash
# Tải và cài đặt
wget https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2.14.0_Linux.tar.gz
tar -xzf ZAP_2.14.0_Linux.tar.gz
sudo mv ZAP_2.14.0 /opt/zap
sudo ln -s /opt/zap/zap.sh /usr/local/bin/zap
```

#### Sử dụng Docker (Khuyến nghị):
```bash
# Chạy ZAP trong Docker container
docker run -d --name zap \
  -p 8080:8080 \
  owasp/zap2docker-stable \
  zap.sh -daemon -host 0.0.0.0 -port 8080 \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true \
  -config api.key=securescan-zap-key
```

### 2. Khởi động ZAP

#### Sử dụng script tự động:
```bash
# Khởi động ZAP
./scripts/start-zap.sh start

# Kiểm tra trạng thái
./scripts/start-zap.sh status

# Dừng ZAP
./scripts/start-zap.sh stop

# Xem logs
./scripts/start-zap.sh logs
```

#### Khởi động thủ công:
```bash
# Chạy ZAP daemon mode
zap.sh -daemon -host 0.0.0.0 -port 8080 \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true \
  -config api.key=securescan-zap-key
```

### 3. Cấu hình Backend

Cập nhật file `.env`:
```env
ZAP_HOST=localhost
ZAP_PORT=8080
ZAP_API_KEY=securescan-zap-key
ZAP_TIMEOUT=3600
```

## Quy trình Scan

### 1. Spider Scan (Khám phá)
- ZAP sẽ crawl website để tìm tất cả các URL
- Phân tích cấu trúc website và các form
- Thời gian: 5-15 phút tùy theo kích thước website

### 2. Active Scan (Quét lỗ hổng)
- Thực hiện các cuộc tấn công thử nghiệm
- Kiểm tra các lỗ hổng OWASP Top 10
- Thời gian: 15-60 phút tùy theo độ phức tạp

### 3. Phân tích kết quả
- Phân loại lỗ hổng theo mức độ nghiêm trọng
- Tạo báo cáo tiếng Việt
- Đưa ra khuyến nghị khắc phục

## Các loại Scan

### Quick Scan (5-10 phút)
```json
{
  "scan_type": "quick",
  "scan_options": {
    "include_passive": true,
    "include_active": false,
    "max_depth": 2
  }
}
```

### Standard Scan (15-30 phút)
```json
{
  "scan_type": "standard", 
  "scan_options": {
    "include_passive": true,
    "include_active": true,
    "max_depth": 3
  }
}
```

### Full Scan (30-60 phút)
```json
{
  "scan_type": "full",
  "scan_options": {
    "include_passive": true,
    "include_active": true,
    "max_depth": 5,
    "scan_policy": "full-scan"
  }
}
```

## API Endpoints

### Bắt đầu Scan
```http
POST /api/v1/scans
Content-Type: application/json
Authorization: Bearer <token>

{
  "domain_id": "uuid",
  "scan_type": "standard",
  "scan_options": {
    "max_depth": 3,
    "exclude_paths": "/admin/*"
  }
}
```

### Theo dõi tiến trình
```javascript
// WebSocket connection
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/scan-progress?token=<token>');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'scan_update') {
    console.log('Progress:', data.data.progress);
  }
};

// Subscribe to scan updates
ws.send(JSON.stringify({
  type: 'subscribe_scan',
  scan_id: 'scan-uuid'
}));
```

### Lấy kết quả
```http
GET /api/v1/scans/{scan_id}/results
Authorization: Bearer <token>
```

## Xử lý lỗi thường gặp

### 1. ZAP không khởi động được
```bash
# Kiểm tra port có bị chiếm không
lsof -i :8080

# Kiểm tra logs
./scripts/start-zap.sh logs

# Thử port khác
ZAP_PORT=8081 ./scripts/start-zap.sh start
```

### 2. Scan bị timeout
```python
# Tăng timeout trong config
ZAP_TIMEOUT=7200  # 2 hours
```

### 3. Website không thể truy cập
```python
# Kiểm tra domain verification
# Đảm bảo website public và accessible
# Kiểm tra firewall/proxy settings
```

## Tối ưu hóa Performance

### 1. Cấu hình ZAP Memory
```bash
# Tăng memory cho ZAP
export JAVA_OPTS="-Xmx4g"
zap.sh -daemon ...
```

### 2. Giới hạn Scan Scope
```json
{
  "scan_options": {
    "max_depth": 3,
    "exclude_paths": "/static/*, /media/*, *.pdf, *.jpg",
    "max_urls": 1000
  }
}
```

### 3. Parallel Scanning
```python
# Cấu hình max concurrent scans
MAX_CONCURRENT_SCANS = 5
```

## Bảo mật

### 1. API Key Management
```bash
# Sử dụng API key mạnh
ZAP_API_KEY=$(openssl rand -hex 32)
```

### 2. Network Security
```bash
# Chỉ cho phép local access
-config api.addrs.addr.name=127.0.0.1
```

### 3. Scan Permissions
```python
# Verify domain ownership trước khi scan
# Blacklist các domain nhạy cảm
# Rate limiting cho scan requests
```

## Monitoring và Logging

### 1. ZAP Logs
```bash
# Xem logs real-time
tail -f ~/.zap/zap.log

# Logs trong Docker
docker logs -f zap-container
```

### 2. Application Logs
```python
import logging

logger = logging.getLogger(__name__)
logger.info(f"Starting scan for {domain.url}")
logger.error(f"Scan failed: {error}")
```

### 3. Metrics
```python
# Track scan metrics
- Scan duration
- Success/failure rates  
- Vulnerabilities found
- Resource usage
```

## Troubleshooting

### Common Issues

1. **ZAP API không phản hồi**
   - Kiểm tra ZAP có đang chạy không
   - Verify API key
   - Check network connectivity

2. **Scan bị stuck**
   - Restart ZAP service
   - Check target website availability
   - Review scan configuration

3. **Memory issues**
   - Increase JVM heap size
   - Limit concurrent scans
   - Clean up old scan data

### Debug Commands

```bash
# Test ZAP API
curl "http://localhost:8080/JSON/core/view/version/?apikey=securescan-zap-key"

# Check scan status
curl "http://localhost:8080/JSON/ascan/view/status/?apikey=securescan-zap-key&scanId=0"

# Get alerts
curl "http://localhost:8080/JSON/core/view/alerts/?apikey=securescan-zap-key"
```

## Tích hợp Production

### 1. Docker Compose
```yaml
services:
  zap:
    image: owasp/zap2docker-stable
    container_name: securescan_zap
    command: zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.key=securescan-zap-key
    ports:
      - "8080:8080"
    volumes:
      - zap_data:/zap/wrk
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/JSON/core/view/version/?apikey=securescan-zap-key"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 2. Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zap-deployment
spec:
  replicas: 2
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
        ports:
        - containerPort: 8080
        command: ["zap.sh", "-daemon", "-host", "0.0.0.0", "-port", "8080"]
```

### 3. Load Balancing
```nginx
upstream zap_backend {
    server zap1:8080;
    server zap2:8080;
    server zap3:8080;
}

location /zap/ {
    proxy_pass http://zap_backend/;
}
```

## Kết luận

OWASP ZAP integration cho phép SecureScan.vn thực hiện quét bảo mật chuyên nghiệp với:

- ✅ Quét tự động các lỗ hổng OWASP Top 10
- ✅ Theo dõi tiến trình real-time qua WebSocket  
- ✅ Báo cáo chi tiết bằng tiếng Việt
- ✅ Tích hợp dễ dàng với Docker
- ✅ Scalable cho production environment

Để biết thêm chi tiết, tham khảo:
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [ZAP API Guide](https://www.zaproxy.org/docs/api/)
- [SecureScan.vn API Documentation](/docs)