# SecureScan.vn - Vulnerability Scanner cho SME Việt Nam

## Tổng quan

SecureScan.vn là nền tảng SaaS quét lỗ hổng bảo mật website đầu tiên tại Việt Nam dành riêng cho doanh nghiệp vừa và nhỏ (SME).

### Tính năng chính

- 🔍 **Quét tự động** - OWASP Top 10:2025, CVE scanning
- 🇻🇳 **100% Tiếng Việt** - UI và báo cáo dễ hiểu
- 💰 **Giá rẻ** - Từ 199k VND/tháng, phù hợp SME
- 📊 **Báo cáo chuyên nghiệp** - Executive summary, PDF export
- ⚡ **Real-time** - WebSocket updates, live progress
- 📱 **Mobile-first** - Responsive design, PWA

### Tech Stack

**Frontend:**
- Next.js 14 + React 18
- TypeScript
- Tailwind CSS
- Zustand + React Query
- WebSocket Client (Real-time updates)

**Backend:**
- FastAPI + Python 3.11
- PostgreSQL + Redis
- SQLAlchemy 2.0
- Celery workers
- WebSocket support

**Security Engines:**
- OWASP ZAP (Multi-instance cluster)
- Nuclei (Secondary scanner)
- SSL Labs API integration

**Infrastructure:**
- Docker + Docker Compose
- Kubernetes (Production)
- HAProxy (Load Balancing)
- Auto-scaling (2-50 ZAP instances)
- Prometheus + Grafana (Monitoring)

## Cài đặt

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/securescan-vn.git
cd securescan-vn

# Start development environment (includes ZAP setup)
./scripts/dev-start.sh

# Or manual setup:
# 1. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 2. Start ZAP instance
./scripts/start-zap.sh start

# 3. Install dependencies and start servers
npm run install:all
npm run dev
```

### Development URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Admin Panel: http://localhost:3000/admin
- ZAP UI: http://localhost:8080

## Project Structure

```
securescan-vn/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom hooks
│   │   ├── stores/          # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/             # API routes (including WebSocket)
│   │   ├── core/            # Core configuration
│   │   ├── models/          # Database models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic & ZAP integration
│   │   │   ├── zap_service.py          # ZAP API interface
│   │   │   ├── zap_load_balancer.py    # Load balancing
│   │   │   ├── zap_pool_manager.py     # Instance management
│   │   │   └── scan_service.py         # Scan orchestration
│   │   └── workers/         # Celery workers
│   ├── alembic/             # Database migrations
│   └── requirements.txt
├── docker/                  # Docker configurations
├── docs/                    # Project documentation
└── ui-mockups/             # UI/UX designs
```

## Development

### Frontend Development

```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
```

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload  # Start dev server
alembic upgrade head           # Run migrations
pytest                         # Run tests
```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Variables

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/securescan
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# Email
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@securescan.vn

# Storage
S3_ENDPOINT=https://your-r2-endpoint
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=securescan-reports

# ZAP Configuration
ZAP_POOL_ENABLED=true              # Enable multi-instance pool
ZAP_MIN_INSTANCES=2                # Minimum ZAP instances
ZAP_MAX_INSTANCES=10               # Maximum ZAP instances
ZAP_BASE_PORT=8080                 # Base port for instances
ZAP_API_KEY=securescan-zap-key     # ZAP API key
MAX_CONCURRENT_SCANS=50            # Max concurrent scans

# Scanners
NUCLEI_TEMPLATES_PATH=/opt/nuclei-templates
```

## Deployment

### Production Build

```bash
# Build all
npm run build

# Or build individually
npm run build:frontend
npm run build:backend
```

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## API Documentation

API documentation is available at `/docs` when running the backend server.

Key endpoints:
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/domains` - List domains
- `POST /api/v1/scans` - Create scan
- `GET /api/v1/scans/{id}` - Get scan results

## ZAP Integration

SecureScan.vn sử dụng kiến trúc multi-tenant với OWASP ZAP để phục vụ hàng nghìn người dùng đồng thời:

### Features
- **Multi-instance ZAP cluster** - Auto-scaling từ 2-50 instances
- **Load balancing** - Phân phối scans across instances
- **Real-time progress** - WebSocket updates
- **Health monitoring** - Auto-recovery cho failed instances
- **Admin dashboard** - Monitor cluster status

### Quick Commands

```bash
# Start ZAP development environment
./scripts/dev-start.sh

# Test ZAP integration
python scripts/test-zap-integration.py

# Stop all services
./scripts/dev-stop.sh

# Check ZAP status
curl http://localhost:8080/JSON/core/view/version/?apikey=securescan-zap-key
```

### Production Deployment

```bash
# Docker Compose (small-medium scale)
docker-compose -f docker-compose.production.yml up -d

# Kubernetes (large scale)
kubectl apply -f k8s/zap-deployment.yaml
kubectl scale deployment zap-cluster --replicas=20
```

📚 **Detailed Documentation**: [ZAP Integration Guide](docs/ZAP-INTEGRATION-GUIDE.md)

## Testing

### Frontend Tests

```bash
cd frontend
npm run test        # Run Jest tests
npm run test:e2e    # Run Playwright E2E tests
```

### Backend Tests

```bash
cd backend
pytest              # Run all tests
pytest -v           # Verbose output
pytest --cov        # With coverage
```

### ZAP Integration Tests

```bash
# Test ZAP services
python scripts/test-zap-integration.py

# Load testing
artillery run load-tests/zap-load-test.yml
k6 run --vus 100 --duration 5m load-tests/scan-load-test.js
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

- 📧 Email: support@securescan.vn
- 💬 Zalo: @securescan
- 📞 Hotline: 1900-xxx-xxx
- 📚 Docs: https://docs.securescan.vn

---

Made with ❤️ for Vietnamese SMEs