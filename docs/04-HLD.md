# High-Level Design (HLD)
# SecureScan.vn - Vulnerability Scanner cho SME Việt Nam

---

## Document Control

| Thông tin | Chi tiết |
|-----------|----------|
| **Tên dự án** | SecureScan.vn |
| **Phiên bản** | 1.0 |
| **Ngày tạo** | 15/12/2025 |
| **Trạng thái** | Draft |

---

## 1. Introduction

### 1.1 Purpose

Tài liệu này mô tả high-level architecture và design của hệ thống SecureScan.vn, bao gồm system overview, component architecture, data flow, và technology stack.

### 1.2 Scope

- System architecture overview
- Component descriptions
- Data flow diagrams
- Technology decisions
- Integration patterns
- Deployment architecture

### 1.3 Definitions

| Term | Definition |
|------|------------|
| **DAST** | Dynamic Application Security Testing |
| **Worker** | Background process xử lý scan jobs |
| **Queue** | Message queue cho async processing |
| **CDN** | Content Delivery Network |

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SECURESCAN.VN ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│                                    ┌─────────────┐                                      │
│                                    │   Users     │                                      │
│                                    │  (Browser)  │                                      │
│                                    └──────┬──────┘                                      │
│                                           │                                              │
│                                           │ HTTPS                                        │
│                                           ▼                                              │
│                              ┌────────────────────────┐                                 │
│                              │      CDN / WAF         │                                 │
│                              │    (Cloudflare)        │                                 │
│                              └───────────┬────────────┘                                 │
│                                          │                                               │
│                    ┌─────────────────────┼─────────────────────┐                        │
│                    │                     │                     │                        │
│                    ▼                     ▼                     ▼                        │
│            ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                  │
│            │  Static      │     │   Web App    │     │     API      │                  │
│            │  Assets      │     │   (Next.js)  │     │   (FastAPI)  │                  │
│            │  (S3/R2)     │     │              │     │              │                  │
│            └──────────────┘     └──────┬───────┘     └──────┬───────┘                  │
│                                        │                     │                          │
│                                        │                     │                          │
│  ┌─────────────────────────────────────┼─────────────────────┼──────────────────────┐  │
│  │                           BACKEND SERVICES                 │                      │  │
│  │                                     │                     │                      │  │
│  │         ┌───────────────────────────┴─────────────────────┘                      │  │
│  │         │                                                                         │  │
│  │         ▼                                                                         │  │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐    │  │
│  │  │   Redis     │     │ PostgreSQL  │     │    S3       │     │   Email     │    │  │
│  │  │   Cache     │     │  Database   │     │  Storage    │     │  Service    │    │  │
│  │  │   + Queue   │     │             │     │  (Reports)  │     │ (SendGrid)  │    │  │
│  │  └──────┬──────┘     └─────────────┘     └─────────────┘     └─────────────┘    │  │
│  │         │                                                                         │  │
│  │         │ Job Queue                                                               │  │
│  │         ▼                                                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │                        SCAN WORKER POOL                                  │    │  │
│  │  │                                                                          │    │  │
│  │  │   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐        │    │  │
│  │  │   │  Worker   │   │  Worker   │   │  Worker   │   │  Worker   │        │    │  │
│  │  │   │    1      │   │    2      │   │    3      │   │    N      │        │    │  │
│  │  │   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘        │    │  │
│  │  │         │               │               │               │               │    │  │
│  │  │         └───────────────┴───────────────┴───────────────┘               │    │  │
│  │  │                                 │                                        │    │  │
│  │  │                                 ▼                                        │    │  │
│  │  │   ┌─────────────────────────────────────────────────────────────────┐  │    │  │
│  │  │   │                    SCAN ENGINE LAYER                             │  │    │  │
│  │  │   │                                                                  │  │    │  │
│  │  │   │    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐│  │    │  │
│  │  │   │    │ OWASP    │    │  Nuclei  │    │   SSL    │    │  Custom  ││  │    │  │
│  │  │   │    │   ZAP    │    │ Scanner  │    │  Checker │    │  Checks  ││  │    │  │
│  │  │   │    └──────────┘    └──────────┘    └──────────┘    └──────────┘│  │    │  │
│  │  │   │                                                                  │  │    │  │
│  │  │   └─────────────────────────────────────────────────────────────────┘  │    │  │
│  │  │                                                                          │    │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│                                           │                                              │
│                                           │ Scan requests                                │
│                                           ▼                                              │
│                                    ┌─────────────┐                                      │
│                                    │   Target    │                                      │
│                                    │  Websites   │                                      │
│                                    └─────────────┘                                      │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Principles

| Principle | Description |
|-----------|-------------|
| **Microservices-ready** | Monolith đầu tiên, tách sau khi scale |
| **Async processing** | Scans chạy async, không block user |
| **Horizontal scaling** | Thêm workers khi cần |
| **Security-first** | Encrypt data, secure by default |
| **Cloud-native** | Containerized, orchestrated |
| **Observable** | Logging, monitoring, tracing |

---

## 3. Component Architecture

### 3.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT DIAGRAM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        PRESENTATION LAYER                            │   │
│  │                                                                      │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │   │
│  │   │   Landing    │    │  Dashboard   │    │    Admin     │         │   │
│  │   │    Page      │    │     SPA      │    │   Console    │         │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘         │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          API LAYER                                   │   │
│  │                                                                      │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │   │
│  │   │    Auth      │    │    Scan      │    │   Report     │         │   │
│  │   │   Service    │    │   Service    │    │   Service    │         │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘         │   │
│  │                                                                      │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │   │
│  │   │   Domain     │    │    User      │    │  Billing     │         │   │
│  │   │   Service    │    │   Service    │    │   Service    │         │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘         │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        BUSINESS LAYER                                │   │
│  │                                                                      │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │   │
│  │   │    Scan      │    │   Finding    │    │  Coverage    │         │   │
│  │   │  Orchestrator│    │  Normalizer  │    │   Tracker    │         │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘         │   │
│  │                                                                      │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │   │
│  │   │    Risk      │    │   Report     │    │ Vietnamese   │         │   │
│  │   │   Scorer     │    │  Generator   │    │ Translator   │         │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘         │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        SCAN ENGINE LAYER                             │   │
│  │                                                                      │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │   │
│  │   │     URL      │    │   OWASP      │    │   Nuclei     │         │   │
│  │   │  Discovery   │    │    ZAP       │    │   Scanner    │         │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘         │   │
│  │                                                                      │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │   │
│  │   │    SSL       │    │   Header     │    │    Tech      │         │   │
│  │   │   Checker    │    │   Checker    │    │  Detector    │         │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘         │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         DATA LAYER                                   │   │
│  │                                                                      │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │   │
│  │   │  PostgreSQL  │    │    Redis     │    │   S3/R2      │         │   │
│  │   │  (Primary)   │    │ (Cache/Queue)│    │  (Storage)   │         │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘         │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Descriptions

#### 3.2.1 Presentation Layer

| Component | Technology | Responsibilities |
|-----------|------------|------------------|
| **Landing Page** | Next.js SSR | Marketing, SEO, Signup |
| **Dashboard SPA** | React + Vite | User dashboard, Scan management |
| **Admin Console** | React Admin | User management, System monitoring |

#### 3.2.2 API Layer

| Component | Responsibilities |
|-----------|------------------|
| **Auth Service** | Registration, Login, JWT management, Password reset |
| **Scan Service** | Create scan, Get progress, Cancel scan |
| **Report Service** | Generate reports, Export PDF, Email reports |
| **Domain Service** | Add domain, Verify ownership, List domains |
| **User Service** | Profile management, Settings |
| **Billing Service** | Subscription management, Payment processing |

#### 3.2.3 Business Layer

| Component | Responsibilities |
|-----------|------------------|
| **Scan Orchestrator** | Coordinate scan workflow, manage scan lifecycle |
| **Finding Normalizer** | Convert scanner outputs to unified format |
| **Coverage Tracker** | Track URLs discovered/scanned/skipped |
| **Risk Scorer** | Calculate risk score (A-F) from findings |
| **Report Generator** | Generate HTML/PDF reports |
| **Vietnamese Translator** | Translate findings to Vietnamese |

#### 3.2.4 Scan Engine Layer

| Component | Technology | Responsibilities |
|-----------|------------|------------------|
| **URL Discovery** | Custom Python | Spider, Sitemap, JS analysis |
| **OWASP ZAP** | ZAP API | DAST scanning, Active/Passive |
| **Nuclei Scanner** | Nuclei CLI | CVE scanning, Template-based |
| **SSL Checker** | Custom + SSL Labs API | SSL/TLS analysis |
| **Header Checker** | Custom Python | Security headers check |
| **Tech Detector** | Wappalyzer | Technology detection |

---

## 4. Data Architecture

### 4.1 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW DIAGRAM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐                                                                │
│  │  User   │                                                                │
│  └────┬────┘                                                                │
│       │                                                                      │
│       │ 1. Create Scan Request                                              │
│       ▼                                                                      │
│  ┌─────────────┐    2. Validate & Queue    ┌─────────────┐                 │
│  │   Web API   │ ─────────────────────────▶│    Redis    │                 │
│  │             │                           │    Queue    │                 │
│  └──────┬──────┘                           └──────┬──────┘                 │
│         │                                         │                         │
│         │ 3. Save scan record                     │ 4. Pick job             │
│         ▼                                         ▼                         │
│  ┌─────────────┐                           ┌─────────────┐                 │
│  │ PostgreSQL  │◀──────────────────────────│   Worker    │                 │
│  │             │   7. Save results         │             │                 │
│  └─────────────┘                           └──────┬──────┘                 │
│                                                   │                         │
│                                                   │ 5. Execute scans        │
│                           ┌───────────────────────┼───────────────────────┐ │
│                           │                       │                       │ │
│                           ▼                       ▼                       ▼ │
│                    ┌──────────┐           ┌──────────┐           ┌──────────┐│
│                    │   ZAP    │           │  Nuclei  │           │   SSL    ││
│                    │ Scanner  │           │ Scanner  │           │  Check   ││
│                    └────┬─────┘           └────┬─────┘           └────┬─────┘│
│                         │                      │                      │      │
│                         │ 6. Scan target       │                      │      │
│                         ▼                      ▼                      ▼      │
│                    ┌───────────────────────────────────────────────────────┐│
│                    │                    TARGET WEBSITE                      ││
│                    └───────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────┐    8. WebSocket updates   ┌─────────────┐                 │
│  │   User      │◀──────────────────────────│   Web API   │                 │
│  │  Browser    │                           │             │                 │
│  └─────────────┘                           └─────────────┘                 │
│                                                                              │
│       │                                                                      │
│       │ 9. View/Download Report                                             │
│       ▼                                                                      │
│  ┌─────────────┐    10. Get report         ┌─────────────┐                 │
│  │   Web API   │ ─────────────────────────▶│  S3 Storage │                 │
│  │             │◀───────────────────────── │  (Reports)  │                 │
│  └─────────────┘    11. Return PDF         └─────────────┘                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Storage Strategy

| Data Type | Storage | Retention | Backup |
|-----------|---------|-----------|--------|
| User data | PostgreSQL | Until deletion | Daily |
| Scan metadata | PostgreSQL | 90 days | Daily |
| Scan findings | PostgreSQL | 90 days | Daily |
| Scan logs | PostgreSQL | 30 days | Weekly |
| PDF reports | S3/R2 | 90 days | Daily |
| Session cache | Redis | 24 hours | N/A |
| Job queue | Redis | Until processed | N/A |
| Rate limiting | Redis | 1 hour | N/A |

### 4.3 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ENTITY RELATIONSHIP DIAGRAM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐         ┌─────────────────┐                           │
│  │      USER       │         │   SUBSCRIPTION  │                           │
│  ├─────────────────┤         ├─────────────────┤                           │
│  │ id (PK)         │────────▶│ id (PK)         │                           │
│  │ email           │    1:1  │ user_id (FK)    │                           │
│  │ password_hash   │         │ plan            │                           │
│  │ full_name       │         │ status          │                           │
│  │ role            │         │ stripe_id       │                           │
│  │ created_at      │         │ current_period  │                           │
│  └────────┬────────┘         └─────────────────┘                           │
│           │                                                                  │
│           │ 1:N                                                              │
│           ▼                                                                  │
│  ┌─────────────────┐                                                        │
│  │     DOMAIN      │                                                        │
│  ├─────────────────┤                                                        │
│  │ id (PK)         │                                                        │
│  │ user_id (FK)    │                                                        │
│  │ url             │                                                        │
│  │ verify_status   │                                                        │
│  │ verify_method   │                                                        │
│  │ verify_token    │                                                        │
│  │ verified_at     │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                  │
│           │ 1:N                                                              │
│           ▼                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐                           │
│  │      SCAN       │         │   SCAN_CONFIG   │                           │
│  ├─────────────────┤         ├─────────────────┤                           │
│  │ id (PK)         │────────▶│ id (PK)         │                           │
│  │ user_id (FK)    │    1:1  │ scan_id (FK)    │                           │
│  │ domain_id (FK)  │         │ scan_depth      │                           │
│  │ status          │         │ excluded_paths  │                           │
│  │ progress        │         │ auth_config     │                           │
│  │ risk_score      │         └─────────────────┘                           │
│  │ started_at      │                                                        │
│  │ completed_at    │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                  │
│           │ 1:N                           1:N                               │
│           ├──────────────────────────────────┐                              │
│           ▼                                  ▼                              │
│  ┌─────────────────┐                ┌─────────────────┐                    │
│  │    FINDING      │                │    SCAN_LOG     │                    │
│  ├─────────────────┤                ├─────────────────┤                    │
│  │ id (PK)         │                │ id (PK)         │                    │
│  │ scan_id (FK)    │                │ scan_id (FK)    │                    │
│  │ title           │                │ level           │                    │
│  │ title_vi        │                │ message         │                    │
│  │ severity        │                │ data (JSONB)    │                    │
│  │ owasp_category  │                │ created_at      │                    │
│  │ cwe_id          │                └─────────────────┘                    │
│  │ description     │                                                        │
│  │ description_vi  │                                                        │
│  │ url             │                                                        │
│  │ evidence        │                                                        │
│  │ solution        │                                                        │
│  │ solution_vi     │                                                        │
│  │ source          │                                                        │
│  │ raw_data (JSON) │                                                        │
│  └─────────────────┘                                                        │
│                                                                              │
│  ┌─────────────────┐         ┌─────────────────┐                           │
│  │  SCHEDULED_SCAN │         │   AUDIT_LOG     │                           │
│  ├─────────────────┤         ├─────────────────┤                           │
│  │ id (PK)         │         │ id (PK)         │                           │
│  │ domain_id (FK)  │         │ user_id (FK)    │                           │
│  │ frequency       │         │ action          │                           │
│  │ day_of_week     │         │ resource_type   │                           │
│  │ time            │         │ resource_id     │                           │
│  │ last_run        │         │ ip_address      │                           │
│  │ next_run        │         │ user_agent      │                           │
│  │ enabled         │         │ created_at      │                           │
│  └─────────────────┘         └─────────────────┘                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Technology Stack

### 5.1 Technology Decisions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TECHNOLOGY STACK                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FRONTEND                                                                    │
│  ├── Framework:        Next.js 14 (React 18)                               │
│  ├── Styling:          Tailwind CSS                                        │
│  ├── State Management: Zustand / React Query                               │
│  ├── Charts:           Recharts                                            │
│  ├── Forms:            React Hook Form + Zod                               │
│  └── Real-time:        Socket.io client                                    │
│                                                                              │
│  BACKEND                                                                     │
│  ├── Framework:        FastAPI (Python 3.11+)                              │
│  ├── ORM:              SQLAlchemy 2.0                                      │
│  ├── Validation:       Pydantic v2                                         │
│  ├── Task Queue:       Celery                                              │
│  ├── WebSocket:        FastAPI WebSocket                                   │
│  └── PDF Generation:   WeasyPrint                                          │
│                                                                              │
│  SCAN ENGINES                                                                │
│  ├── DAST:             OWASP ZAP 2.14+                                     │
│  ├── CVE Scanner:      Nuclei v3+                                          │
│  ├── SSL Analysis:     Custom + SSL Labs API                               │
│  └── Tech Detection:   Wappalyzer                                          │
│                                                                              │
│  DATA STORES                                                                 │
│  ├── Primary DB:       PostgreSQL 15                                       │
│  ├── Cache:            Redis 7                                             │
│  ├── Queue:            Redis (Celery broker)                               │
│  └── Object Storage:   S3-compatible (Cloudflare R2)                       │
│                                                                              │
│  INFRASTRUCTURE                                                              │
│  ├── Container:        Docker                                              │
│  ├── Orchestration:    Docker Compose (MVP) → Kubernetes (Scale)           │
│  ├── CI/CD:            GitHub Actions                                      │
│  ├── Hosting:          Hetzner Cloud / DigitalOcean                        │
│  └── CDN/WAF:          Cloudflare                                          │
│                                                                              │
│  MONITORING                                                                  │
│  ├── Logging:          Loki + Grafana                                      │
│  ├── Metrics:          Prometheus + Grafana                                │
│  ├── APM:              Sentry                                              │
│  └── Uptime:           UptimeRobot / Better Uptime                         │
│                                                                              │
│  THIRD-PARTY SERVICES                                                        │
│  ├── Email:            SendGrid / Amazon SES                               │
│  ├── Payment:          Stripe (future: VNPay)                              │
│  └── Auth (optional):  Auth0 / Clerk                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Technology Rationale

| Choice | Rationale |
|--------|-----------|
| **FastAPI** | High performance, async support, auto API docs, Python ecosystem |
| **Next.js** | SSR for SEO, React ecosystem, good DX |
| **PostgreSQL** | Reliable, JSONB support, good for complex queries |
| **Redis** | Fast caching, pub/sub for real-time, Celery broker |
| **OWASP ZAP** | Industry standard DAST, API support, active community |
| **Nuclei** | Fast CVE scanning, huge template library, CLI-friendly |
| **Docker** | Consistent environments, easy scaling, isolated scanners |
| **Cloudflare** | Global CDN, DDoS protection, R2 storage |

---

## 6. Integration Architecture

### 6.1 External Integrations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL INTEGRATIONS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              SecureScan.vn                                   │
│                                    │                                         │
│           ┌────────────────────────┼────────────────────────┐               │
│           │                        │                        │               │
│           ▼                        ▼                        ▼               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   Email         │    │    Payment      │    │    SSL Labs     │        │
│  │   (SendGrid)    │    │    (Stripe)     │    │      API        │        │
│  │                 │    │                 │    │                 │        │
│  │  • Transactional│    │  • Subscriptions│    │  • SSL analysis │        │
│  │  • Notifications│    │  • Invoices     │    │  • Certificate  │        │
│  │  • Reports      │    │  • Webhooks     │    │    validation   │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                              │
│           ┌────────────────────────┼────────────────────────┐               │
│           │                        │                        │               │
│           ▼                        ▼                        ▼               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   Cloudflare    │    │    Sentry       │    │   NVD/CVE       │        │
│  │                 │    │                 │    │   Database      │        │
│  │  • CDN          │    │  • Error track  │    │                 │        │
│  │  • WAF          │    │  • Performance  │    │  • CVE lookup   │        │
│  │  • R2 Storage   │    │  • Alerts       │    │  • CVSS scores  │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 API Design Principles

| Principle | Implementation |
|-----------|----------------|
| **RESTful** | Resource-based URLs, HTTP methods |
| **Versioning** | URL versioning (/api/v1/) |
| **Authentication** | JWT Bearer tokens |
| **Rate Limiting** | Per-user, per-endpoint limits |
| **Pagination** | Cursor-based for large lists |
| **Error Handling** | Consistent error response format |
| **Documentation** | OpenAPI/Swagger auto-generated |

---

## 7. Security Architecture

### 7.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 1: PERIMETER                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Cloudflare WAF                                                      │   │
│  │  • DDoS protection                                                   │   │
│  │  • Bot detection                                                     │   │
│  │  • Rate limiting                                                     │   │
│  │  • IP blocking                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  LAYER 2: APPLICATION                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Application Security                                                │   │
│  │  • Input validation (Pydantic)                                      │   │
│  │  • Output encoding                                                   │   │
│  │  • CSRF protection                                                   │   │
│  │  • Content Security Policy                                          │   │
│  │  • CORS configuration                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  LAYER 3: AUTHENTICATION & AUTHORIZATION                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Auth Layer                                                          │   │
│  │  • JWT tokens (short-lived)                                         │   │
│  │  • Refresh tokens (httpOnly cookie)                                 │   │
│  │  • Role-based access control                                        │   │
│  │  • Resource-level permissions                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  LAYER 4: DATA                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Data Security                                                       │   │
│  │  • Encryption at rest (AES-256)                                     │   │
│  │  • Encryption in transit (TLS 1.3)                                  │   │
│  │  • Password hashing (bcrypt)                                        │   │
│  │  • Secrets management (env vars / Vault)                            │   │
│  │  • Database access control                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  LAYER 5: MONITORING                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Security Monitoring                                                 │   │
│  │  • Audit logging                                                    │   │
│  │  • Anomaly detection                                                │   │
│  │  • Failed login monitoring                                          │   │
│  │  • API abuse detection                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Scan Security Controls

| Control | Description |
|---------|-------------|
| **Domain Verification** | Must prove ownership before scanning |
| **Rate Limiting** | Max requests per minute to targets |
| **Blacklist** | Cannot scan government, financial sites |
| **Consent Logging** | Log user consent for each scan |
| **Scan Isolation** | Each scan runs in isolated container |
| **Output Sanitization** | Sanitize scanner output before storage |

---

## 8. Deployment Architecture

### 8.1 Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           CLOUDFLARE                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • DNS                                                               │   │
│  │  • CDN (static assets)                                              │   │
│  │  • WAF                                                               │   │
│  │  • R2 (object storage)                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│                           HETZNER CLOUD                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    APPLICATION SERVER                        │   │   │
│  │  │                    (CX21 - 2vCPU, 4GB)                       │   │   │
│  │  │                                                              │   │   │
│  │  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │   │
│  │  │   │   Nginx     │  │  Next.js    │  │   FastAPI   │        │   │   │
│  │  │   │   Proxy     │  │    App      │  │    API      │        │   │   │
│  │  │   └─────────────┘  └─────────────┘  └─────────────┘        │   │   │
│  │  │                                                              │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    WORKER SERVER                             │   │   │
│  │  │                    (CX31 - 4vCPU, 8GB)                       │   │   │
│  │  │                                                              │   │   │
│  │  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │   │
│  │  │   │   Celery    │  │  OWASP ZAP  │  │   Nuclei    │        │   │   │
│  │  │   │   Worker    │  │  Container  │  │  Container  │        │   │   │
│  │  │   │   (x4)      │  │             │  │             │        │   │   │
│  │  │   └─────────────┘  └─────────────┘  └─────────────┘        │   │   │
│  │  │                                                              │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    DATA SERVER                               │   │   │
│  │  │                    (CX21 - 2vCPU, 4GB)                       │   │   │
│  │  │                                                              │   │   │
│  │  │   ┌─────────────┐  ┌─────────────┐                          │   │   │
│  │  │   │ PostgreSQL  │  │    Redis    │                          │   │   │
│  │  │   │             │  │             │                          │   │   │
│  │  │   └─────────────┘  └─────────────┘                          │   │   │
│  │  │                                                              │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Monthly Cost Estimate: ~$50-80                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Scaling Strategy

| Phase | Users | Infrastructure |
|-------|-------|----------------|
| **MVP** | 0-100 | Single server, 2 workers |
| **Growth** | 100-500 | Separate servers, 4 workers |
| **Scale** | 500-2000 | Load balancer, auto-scaling workers |
| **Enterprise** | 2000+ | Kubernetes, multi-region |

---

## 9. Non-Functional Architecture

### 9.1 Performance Architecture

| Aspect | Strategy |
|--------|----------|
| **Caching** | Redis for sessions, API responses, scan results |
| **CDN** | Static assets via Cloudflare CDN |
| **Database** | Connection pooling, read replicas (future) |
| **Async** | Background jobs for scanning, report generation |
| **Compression** | Gzip/Brotli for API responses |

### 9.2 Availability Architecture

| Aspect | Strategy |
|--------|----------|
| **Load Balancing** | Cloudflare (DNS-level), Nginx (app-level) |
| **Health Checks** | Endpoint monitoring, container health |
| **Failover** | Database replication, worker redundancy |
| **Backup** | Daily database backups to R2 |
| **Recovery** | Documented disaster recovery procedures |

### 9.3 Observability Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OBSERVABILITY STACK                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LOGS                      METRICS                    TRACES                 │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   Loki       │         │  Prometheus  │         │   Sentry     │        │
│  │              │         │              │         │              │        │
│  │  • App logs  │         │  • CPU/RAM   │         │  • Errors    │        │
│  │  • Scan logs │         │  • Requests  │         │  • Perf      │        │
│  │  • Audit     │         │  • Queue     │         │  • Traces    │        │
│  └──────┬───────┘         └──────┬───────┘         └──────────────┘        │
│         │                        │                                          │
│         └────────────┬───────────┘                                          │
│                      ▼                                                       │
│              ┌──────────────┐                                               │
│              │   Grafana    │                                               │
│              │              │                                               │
│              │  • Dashboards│                                               │
│              │  • Alerts    │                                               │
│              │  • Reports   │                                               │
│              └──────────────┘                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Appendices

### Appendix A: API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Refresh token |
| GET | /api/v1/domains | List user domains |
| POST | /api/v1/domains | Add domain |
| POST | /api/v1/domains/{id}/verify | Verify domain |
| GET | /api/v1/scans | List scans |
| POST | /api/v1/scans | Create scan |
| GET | /api/v1/scans/{id} | Get scan details |
| GET | /api/v1/scans/{id}/progress | Get progress (WS) |
| GET | /api/v1/scans/{id}/findings | Get findings |
| GET | /api/v1/scans/{id}/report | Get report |
| GET | /api/v1/scans/{id}/report/pdf | Download PDF |

### Appendix B: Configuration Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| SCAN_TIMEOUT_MINUTES | 60 | Max scan duration |
| MAX_CONCURRENT_SCANS | 50 | System-wide limit |
| WORKER_CONCURRENCY | 4 | Per-worker tasks |
| CACHE_TTL_SECONDS | 3600 | Default cache TTL |
| JWT_EXPIRY_HOURS | 24 | Access token expiry |
| REFRESH_EXPIRY_DAYS | 7 | Refresh token expiry |

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tech Lead | | | |
| Architect | | | |
| DevOps Lead | | | |
