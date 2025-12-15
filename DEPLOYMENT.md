# Deployment Guide - SecureScan.vn

## Quick Start

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd securescan-vn

# Run setup script
./scripts/setup.sh

# Or for local development
./scripts/dev.sh
```

### Production Deployment

#### 1. Server Requirements

**Minimum Requirements:**
- 2 vCPU, 4GB RAM, 50GB SSD
- Ubuntu 20.04+ or CentOS 8+
- Docker 24+ and Docker Compose

**Recommended (Production):**
- 4 vCPU, 8GB RAM, 100GB SSD
- Load balancer (Nginx/Cloudflare)
- Managed database (PostgreSQL)
- Redis cluster

#### 2. Environment Configuration

```bash
# Copy and edit environment file
cp .env.example .env
nano .env
```

**Critical settings to update:**
```bash
# Security
APP_SECRET_KEY=your-super-secret-key-256-bits
JWT_SECRET_KEY=your-jwt-secret-key-256-bits

# Database (use managed service in production)
DATABASE_URL=postgresql://user:pass@db-host:5432/securescan

# Email
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com

# Storage
S3_ENDPOINT=https://your-r2-endpoint
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# Domain
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

#### 3. SSL Certificate Setup

```bash
# Create SSL directory
mkdir -p docker/nginx/ssl

# Copy your SSL certificates
cp your-cert.pem docker/nginx/ssl/
cp your-key.pem docker/nginx/ssl/

# Or use Let's Encrypt
certbot certonly --standalone -d yourdomain.com
```

#### 4. Deploy with Docker

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d --build

# Check service health
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

#### 5. Database Migration

```bash
# Run initial migration
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Create admin user (optional)
docker-compose -f docker-compose.prod.yml exec backend python scripts/create_admin.py
```

## Infrastructure Options

### Option 1: Single Server (Small Scale)

**Hetzner Cloud CX31 (4 vCPU, 8GB RAM)**
- Cost: ~€15/month
- Suitable for: 0-1000 users
- All services on one server

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Deploy
git clone <repo>
cd securescan-vn
./scripts/setup.sh
```

### Option 2: Multi-Server (Medium Scale)

**Architecture:**
- App Server: Hetzner CX31 (€15/month)
- Database: Managed PostgreSQL (€20/month)
- Redis: Managed Redis (€10/month)
- CDN: Cloudflare (Free/Pro)

**Total: ~€45/month for 1000-10000 users**

### Option 3: Kubernetes (Large Scale)

**For 10000+ users:**
- Kubernetes cluster (GKE/EKS/AKS)
- Managed databases
- Auto-scaling
- Multi-region deployment

## Monitoring & Maintenance

### Health Checks

```bash
# Check all services
curl https://yourdomain.com/health
curl https://yourdomain.com/api/v1/health

# Database connection
docker-compose exec backend python -c "from app.core.database import engine; print('DB OK')"
```

### Backup Strategy

```bash
# Database backup (daily)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/

# Retention: Keep 30 daily, 12 monthly backups
```

### Log Management

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery_worker

# Log rotation (add to crontab)
0 2 * * * docker system prune -f
```

### Updates

```bash
# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Database migration
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Security Checklist

### Server Security
- [ ] SSH key-only access
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Fail2ban installed
- [ ] Regular security updates
- [ ] Non-root user for deployment

### Application Security
- [ ] Strong secret keys (256-bit)
- [ ] HTTPS only (HSTS enabled)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation
- [ ] SQL injection protection
- [ ] XSS protection

### Data Security
- [ ] Database encryption at rest
- [ ] Backup encryption
- [ ] Access logging
- [ ] GDPR compliance
- [ ] Data retention policies

## Performance Optimization

### Database
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_scans_user_created ON scans(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_findings_scan_severity ON findings(scan_id, severity);
```

### Caching
```bash
# Redis configuration
maxmemory 1gb
maxmemory-policy allkeys-lru
```

### CDN Setup (Cloudflare)
1. Add domain to Cloudflare
2. Configure DNS records
3. Enable caching rules
4. Set up WAF rules

## Troubleshooting

### Common Issues

**Backend not starting:**
```bash
# Check logs
docker-compose logs backend

# Common fixes
docker-compose down
docker-compose up -d --build
```

**Database connection issues:**
```bash
# Check PostgreSQL
docker-compose exec postgres psql -U securescan -d securescan_dev -c "SELECT 1;"

# Reset database
docker-compose down -v
docker-compose up -d
```

**High memory usage:**
```bash
# Check container stats
docker stats

# Restart services
docker-compose restart
```

### Performance Issues

**Slow scans:**
- Check ZAP container resources
- Increase worker concurrency
- Optimize scan configurations

**High database load:**
- Add database indexes
- Optimize queries
- Consider read replicas

## Support

For deployment support:
- 📧 Email: devops@securescan.vn
- 💬 Zalo: @securescan-support
- 📚 Docs: https://docs.securescan.vn/deployment