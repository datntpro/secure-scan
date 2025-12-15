# Low-Level Design (LLD)
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

Tài liệu này mô tả chi tiết low-level design của hệ thống SecureScan.vn, bao gồm database schema, API specifications, class diagrams, và implementation details.

### 1.2 Scope

- Database schema chi tiết
- API specifications với request/response examples
- Class và sequence diagrams
- Algorithm descriptions
- Error handling strategies
- Code structure

---

## 2. Database Design

### 2.1 Database Schema

#### 2.1.1 Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### 2.1.2 Subscriptions Table

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    scans_used_this_month INTEGER DEFAULT 0,
    scans_limit INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
```

#### 2.1.3 Domains Table

```sql
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    normalized_url VARCHAR(255) NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'verified', 'expired', 'failed')),
    verification_method VARCHAR(20) CHECK (verification_method IN ('dns', 'file')),
    verification_token VARCHAR(64) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    last_scan_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_domain UNIQUE (user_id, normalized_url)
);

CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_domains_verification_status ON domains(verification_status);
CREATE INDEX idx_domains_normalized_url ON domains(normalized_url);
```

#### 2.1.4 Scans Table

```sql
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    scan_type VARCHAR(20) DEFAULT 'standard'
        CHECK (scan_type IN ('quick', 'standard', 'thorough')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_phase VARCHAR(50),
    
    -- Coverage metrics
    urls_discovered INTEGER DEFAULT 0,
    urls_scanned INTEGER DEFAULT 0,
    urls_skipped INTEGER DEFAULT 0,
    urls_failed INTEGER DEFAULT 0,
    forms_found INTEGER DEFAULT 0,
    forms_tested INTEGER DEFAULT 0,
    
    -- Results summary
    findings_critical INTEGER DEFAULT 0,
    findings_high INTEGER DEFAULT 0,
    findings_medium INTEGER DEFAULT 0,
    findings_low INTEGER DEFAULT 0,
    findings_info INTEGER DEFAULT 0,
    risk_score VARCHAR(2),
    
    -- Timing
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    scan_duration_seconds INTEGER,
    error_message TEXT,
    report_path VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_domain_id ON scans(domain_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
```

#### 2.1.5 Scan Configs Table

```sql
CREATE TABLE scan_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    
    -- Scan settings
    max_depth INTEGER DEFAULT 5,
    max_urls INTEGER DEFAULT 500,
    scan_speed VARCHAR(20) DEFAULT 'normal' 
        CHECK (scan_speed IN ('fast', 'normal', 'slow')),
    
    -- Scope settings
    excluded_paths JSONB DEFAULT '[]'::jsonb,
    included_paths JSONB DEFAULT '[]'::jsonb,
    
    -- Authentication
    auth_type VARCHAR(20) CHECK (auth_type IN ('none', 'basic', 'form', 'header')),
    auth_config JSONB,  -- Encrypted credentials
    
    -- Scanner toggles
    enable_zap_passive BOOLEAN DEFAULT TRUE,
    enable_zap_active BOOLEAN DEFAULT TRUE,
    enable_nuclei BOOLEAN DEFAULT TRUE,
    enable_ssl_check BOOLEAN DEFAULT TRUE,
    enable_header_check BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scan_configs_scan_id ON scan_configs(scan_id);
```

#### 2.1.6 Findings Table

```sql
CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    
    -- Identification
    fingerprint VARCHAR(64) NOT NULL,  -- Hash for deduplication
    
    -- Basic info
    title VARCHAR(500) NOT NULL,
    title_vi VARCHAR(500),
    severity VARCHAR(20) NOT NULL 
        CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    confidence VARCHAR(20) DEFAULT 'medium'
        CHECK (confidence IN ('confirmed', 'high', 'medium', 'low')),
    
    -- Classification
    owasp_category VARCHAR(100),
    cwe_id VARCHAR(20),
    cve_id VARCHAR(30),
    cvss_score DECIMAL(3,1),
    
    -- Details
    description TEXT,
    description_vi TEXT,
    affected_url VARCHAR(2048),
    affected_parameter VARCHAR(255),
    evidence TEXT,
    
    -- Remediation
    solution TEXT,
    solution_vi TEXT,
    references JSONB DEFAULT '[]'::jsonb,
    
    -- Source tracking
    source VARCHAR(50) NOT NULL,  -- zap, nuclei, ssl_check, etc.
    source_rule_id VARCHAR(100),
    raw_data JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('open', 'fixed', 'false_positive', 'accepted')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_findings_scan_id ON findings(scan_id);
CREATE INDEX idx_findings_severity ON findings(severity);
CREATE INDEX idx_findings_fingerprint ON findings(fingerprint);
CREATE INDEX idx_findings_cwe_id ON findings(cwe_id);
```

#### 2.1.7 Scan Logs Table

```sql
CREATE TABLE scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    phase VARCHAR(50),
    message TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scan_logs_scan_id ON scan_logs(scan_id);
CREATE INDEX idx_scan_logs_created_at ON scan_logs(created_at);

-- Partition by month for performance
-- CREATE TABLE scan_logs_2025_12 PARTITION OF scan_logs
--     FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
```

#### 2.1.8 Scheduled Scans Table

```sql
CREATE TABLE scheduled_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    
    frequency VARCHAR(20) NOT NULL 
        CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 28),
    time_utc TIME NOT NULL,
    
    scan_type VARCHAR(20) DEFAULT 'standard',
    enabled BOOLEAN DEFAULT TRUE,
    
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_scan_id UUID REFERENCES scans(id),
    next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    notify_on_complete BOOLEAN DEFAULT TRUE,
    notify_on_new_findings BOOLEAN DEFAULT TRUE,
    notification_emails JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_scans_next_run ON scheduled_scans(next_run_at) 
    WHERE enabled = TRUE;
CREATE INDEX idx_scheduled_scans_domain_id ON scheduled_scans(domain_id);
```

#### 2.1.9 Audit Logs Table

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 2.2 Database Views

#### 2.2.1 User Dashboard View

```sql
CREATE VIEW v_user_dashboard AS
SELECT 
    u.id AS user_id,
    u.email,
    u.full_name,
    s.plan,
    s.scans_used_this_month,
    s.scans_limit,
    COUNT(DISTINCT d.id) AS total_domains,
    COUNT(DISTINCT CASE WHEN d.verification_status = 'verified' THEN d.id END) AS verified_domains,
    COUNT(DISTINCT sc.id) AS total_scans,
    COUNT(DISTINCT CASE WHEN sc.status = 'completed' THEN sc.id END) AS completed_scans,
    MAX(sc.completed_at) AS last_scan_date
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN domains d ON u.id = d.user_id
LEFT JOIN scans sc ON u.id = sc.user_id
GROUP BY u.id, u.email, u.full_name, s.plan, s.scans_used_this_month, s.scans_limit;
```

#### 2.2.2 Scan Summary View

```sql
CREATE VIEW v_scan_summary AS
SELECT 
    s.id,
    s.user_id,
    s.domain_id,
    d.url AS domain_url,
    s.status,
    s.progress,
    s.risk_score,
    s.findings_critical,
    s.findings_high,
    s.findings_medium,
    s.findings_low,
    s.findings_info,
    (s.findings_critical + s.findings_high + s.findings_medium + 
     s.findings_low + s.findings_info) AS total_findings,
    s.urls_discovered,
    s.urls_scanned,
    CASE 
        WHEN s.urls_discovered > 0 
        THEN ROUND((s.urls_scanned::numeric / s.urls_discovered) * 100, 1)
        ELSE 0 
    END AS coverage_percentage,
    s.scan_duration_seconds,
    s.created_at,
    s.completed_at
FROM scans s
JOIN domains d ON s.domain_id = d.id;
```

---

## 3. API Specifications

### 3.1 Authentication APIs

#### 3.1.1 POST /api/v1/auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "Nguyễn Văn A",
  "company": "ABC Company"  // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận.",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      {
        "field": "password",
        "message": "Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 số"
      }
    ]
  }
}
```

#### 3.1.2 POST /api/v1/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "role": "user",
      "plan": "starter"
    }
  }
}
```

### 3.2 Domain APIs

#### 3.2.1 POST /api/v1/domains

**Request:**
```json
{
  "url": "https://myshop.vn"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "url": "https://myshop.vn",
    "verification_status": "pending",
    "verification_token": "securescan-verify-abc123def456",
    "verification_methods": {
      "dns": {
        "type": "TXT",
        "name": "_securescan.myshop.vn",
        "value": "securescan-verify-abc123def456"
      },
      "file": {
        "path": "/.well-known/securescan-verify.txt",
        "content": "securescan-verify-abc123def456"
      }
    },
    "created_at": "2025-12-15T10:00:00Z"
  }
}
```

#### 3.2.2 POST /api/v1/domains/{id}/verify

**Request:**
```json
{
  "method": "dns"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "verification_status": "verified",
    "verified_at": "2025-12-15T10:05:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VERIFICATION_FAILED",
    "message": "Không tìm thấy bản ghi DNS TXT. Vui lòng kiểm tra lại và thử lại sau 5 phút."
  }
}
```

### 3.3 Scan APIs

#### 3.3.1 POST /api/v1/scans

**Request:**
```json
{
  "domain_id": "660e8400-e29b-41d4-a716-446655440001",
  "scan_type": "standard",
  "config": {
    "max_depth": 5,
    "excluded_paths": ["/admin/*", "/api/internal/*"]
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "domain_id": "660e8400-e29b-41d4-a716-446655440001",
    "domain_url": "https://myshop.vn",
    "status": "queued",
    "scan_type": "standard",
    "progress": 0,
    "queued_at": "2025-12-15T10:10:00Z",
    "estimated_duration_minutes": 15
  }
}
```

#### 3.3.2 GET /api/v1/scans/{id}

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "domain_id": "660e8400-e29b-41d4-a716-446655440001",
    "domain_url": "https://myshop.vn",
    "status": "completed",
    "scan_type": "standard",
    "progress": 100,
    "current_phase": null,
    
    "coverage": {
      "urls_discovered": 156,
      "urls_scanned": 122,
      "urls_skipped": 28,
      "urls_failed": 6,
      "coverage_percentage": 78.2,
      "forms_found": 12,
      "forms_tested": 12
    },
    
    "summary": {
      "risk_score": "C",
      "total_findings": 17,
      "by_severity": {
        "critical": 1,
        "high": 3,
        "medium": 5,
        "low": 6,
        "info": 2
      },
      "by_owasp": {
        "A01:2025 - Broken Access Control": 2,
        "A02:2025 - Security Misconfiguration": 5,
        "A05:2025 - Injection": 1
      }
    },
    
    "timing": {
      "queued_at": "2025-12-15T10:10:00Z",
      "started_at": "2025-12-15T10:12:00Z",
      "completed_at": "2025-12-15T10:24:00Z",
      "duration_seconds": 720
    },
    
    "technologies_detected": [
      "WordPress 6.4.2",
      "PHP 8.1",
      "MySQL",
      "Nginx 1.24"
    ]
  }
}
```

#### 3.3.3 GET /api/v1/scans/{id}/findings

**Query Parameters:**
- `severity` (optional): critical,high,medium,low,info
- `owasp_category` (optional): A01,A02,...
- `status` (optional): open,fixed,false_positive
- `page` (optional): default 1
- `limit` (optional): default 20, max 100

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "title": "SQL Injection",
        "title_vi": "Lỗ hổng SQL Injection",
        "severity": "critical",
        "confidence": "confirmed",
        "owasp_category": "A05:2025 - Injection",
        "cwe_id": "CWE-89",
        "cvss_score": 9.8,
        "description_vi": "Phát hiện lỗ hổng SQL Injection tại form đăng nhập...",
        "affected_url": "https://myshop.vn/login",
        "affected_parameter": "username",
        "evidence": "Parameter 'username' vulnerable to: ' OR '1'='1",
        "solution_vi": "**Cách khắc phục:**\n1. Sử dụng Prepared Statements...",
        "source": "zap",
        "status": "open",
        "created_at": "2025-12-15T10:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_items": 17,
      "total_pages": 1
    }
  }
}
```

#### 3.3.4 WebSocket: /api/v1/scans/{id}/progress

**Connection:** `wss://api.securescan.vn/api/v1/scans/{id}/progress?token={jwt}`

**Server Messages:**
```json
// Progress update
{
  "type": "progress",
  "data": {
    "progress": 45,
    "phase": "vulnerability_scanning",
    "phase_vi": "Đang quét lỗ hổng",
    "urls_scanned": 56,
    "urls_discovered": 120,
    "findings_count": 8
  }
}

// Log message
{
  "type": "log",
  "data": {
    "level": "info",
    "message": "Phát hiện URL mới",
    "details": {
      "url": "https://myshop.vn/products",
      "source": "spider"
    }
  }
}

// Scan completed
{
  "type": "completed",
  "data": {
    "status": "completed",
    "risk_score": "C",
    "total_findings": 17
  }
}
```

### 3.4 Report APIs

#### 3.4.1 GET /api/v1/scans/{id}/report

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "scan_id": "770e8400-e29b-41d4-a716-446655440002",
    "generated_at": "2025-12-15T10:30:00Z",
    
    "executive_summary": {
      "target": "https://myshop.vn",
      "scan_date": "2025-12-15",
      "risk_score": "C",
      "risk_level_vi": "Trung bình - Cần cải thiện",
      "key_findings": [
        "Phát hiện 1 lỗ hổng nghiêm trọng (SQL Injection)",
        "34 trang yêu cầu đăng nhập chưa được scan",
        "Thiếu 3 security headers quan trọng"
      ],
      "recommendation_vi": "Website có các lỗ hổng bảo mật cần được khắc phục ngay. Đề xuất ưu tiên fix các lỗi Critical và High trong vòng 7 ngày."
    },
    
    "coverage_report": {
      "total_urls_discovered": 156,
      "urls_scanned": 122,
      "coverage_percentage": 78.2,
      "skipped_reasons": {
        "requires_authentication": 34,
        "server_error": 6,
        "external_domain": 7,
        "excluded_by_config": 15
      }
    },
    
    "owasp_compliance": {
      "version": "2025",
      "score": "6/10",
      "categories": [
        {
          "id": "A01",
          "name": "Broken Access Control",
          "status": "FAIL",
          "findings_count": 2
        }
      ]
    },
    
    "findings": [
      // Full findings list
    ],
    
    "tests_executed": {
      "total": 45,
      "by_category": {
        "injection": {"executed": 11, "total": 11},
        "authentication": {"executed": 5, "total": 5},
        "configuration": {"executed": 7, "total": 7}
      }
    },
    
    "verification_guide": [
      {
        "finding_type": "Missing HSTS Header",
        "how_to_verify": "Mở Chrome DevTools → Network → Kiểm tra Response Headers"
      }
    ]
  }
}
```

#### 3.4.2 GET /api/v1/scans/{id}/report/pdf

**Response:** Binary PDF file with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="securescan_report_myshop.vn_2025-12-15.pdf"
```

---

## 4. Class Diagrams

### 4.1 Domain Models

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOMAIN MODELS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐           ┌─────────────────────┐                 │
│  │       User          │           │    Subscription     │                 │
│  ├─────────────────────┤           ├─────────────────────┤                 │
│  │ - id: UUID          │    1:1    │ - id: UUID          │                 │
│  │ - email: str        │──────────▶│ - user_id: UUID     │                 │
│  │ - password_hash: str│           │ - plan: PlanType    │                 │
│  │ - full_name: str    │           │ - status: SubStatus │                 │
│  │ - role: Role        │           │ - scans_used: int   │                 │
│  │ - email_verified:   │           │ - scans_limit: int  │                 │
│  │   bool              │           │ - current_period_   │                 │
│  ├─────────────────────┤           │   start: datetime   │                 │
│  │ + verify_password() │           ├─────────────────────┤                 │
│  │ + can_scan(): bool  │           │ + can_scan(): bool  │                 │
│  │ + get_quota(): int  │           │ + increment_usage() │                 │
│  └──────────┬──────────┘           │ + reset_monthly()   │                 │
│             │                       └─────────────────────┘                 │
│             │ 1:N                                                            │
│             ▼                                                                │
│  ┌─────────────────────┐                                                    │
│  │       Domain        │                                                    │
│  ├─────────────────────┤                                                    │
│  │ - id: UUID          │                                                    │
│  │ - user_id: UUID     │                                                    │
│  │ - url: str          │                                                    │
│  │ - normalized_url:str│                                                    │
│  │ - verification_     │                                                    │
│  │   status: VerifyStatus                                                   │
│  │ - verification_     │                                                    │
│  │   token: str        │                                                    │
│  ├─────────────────────┤                                                    │
│  │ + verify_dns(): bool│                                                    │
│  │ + verify_file():bool│                                                    │
│  │ + is_verified():bool│                                                    │
│  │ + can_scan(): bool  │                                                    │
│  └──────────┬──────────┘                                                    │
│             │ 1:N                                                            │
│             ▼                                                                │
│  ┌─────────────────────┐           ┌─────────────────────┐                 │
│  │        Scan         │    1:N    │      Finding        │                 │
│  ├─────────────────────┤──────────▶├─────────────────────┤                 │
│  │ - id: UUID          │           │ - id: UUID          │                 │
│  │ - domain_id: UUID   │           │ - scan_id: UUID     │                 │
│  │ - status: ScanStatus│           │ - title: str        │                 │
│  │ - progress: int     │           │ - title_vi: str     │                 │
│  │ - risk_score: str   │           │ - severity: Severity│                 │
│  │ - urls_discovered:  │           │ - owasp_category:str│                 │
│  │   int               │           │ - cwe_id: str       │                 │
│  │ - findings_critical:│           │ - description: str  │                 │
│  │   int               │           │ - solution: str     │                 │
│  ├─────────────────────┤           │ - evidence: str     │                 │
│  │ + start()           │           │ - source: str       │                 │
│  │ + cancel()          │           ├─────────────────────┤                 │
│  │ + update_progress() │           │ + to_vietnamese()   │                 │
│  │ + complete()        │           │ + get_owasp_mapping │                 │
│  │ + calculate_risk()  │           └─────────────────────┘                 │
│  └─────────────────────┘                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Service Classes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE CLASSES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        ScanOrchestrator                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ - url_discovery: URLDiscovery                                        │   │
│  │ - zap_scanner: ZAPScanner                                           │   │
│  │ - nuclei_scanner: NucleiScanner                                     │   │
│  │ - ssl_checker: SSLChecker                                           │   │
│  │ - header_checker: HeaderChecker                                     │   │
│  │ - coverage_tracker: CoverageTracker                                 │   │
│  │ - finding_normalizer: FindingNormalizer                             │   │
│  │ - report_generator: ReportGenerator                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ + execute_scan(scan_id: UUID)                                       │   │
│  │ + _discover_urls(target: str) → List[URL]                          │   │
│  │ + _run_passive_scan(urls: List[URL]) → List[Finding]               │   │
│  │ + _run_active_scan(urls: List[URL]) → List[Finding]                │   │
│  │ + _run_nuclei_scan(target: str) → List[Finding]                    │   │
│  │ + _check_ssl(target: str) → List[Finding]                          │   │
│  │ + _check_headers(urls: List[URL]) → List[Finding]                  │   │
│  │ + _aggregate_results(findings: List[Finding]) → ScanResult         │   │
│  │ + _calculate_risk_score(findings: List[Finding]) → str             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        FindingNormalizer                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ - vietnamese_db: VietnameseTranslationDB                            │   │
│  │ - owasp_mapper: OWASPMapper                                         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ + normalize_zap_alert(alert: dict) → Finding                        │   │
│  │ + normalize_nuclei_finding(finding: dict) → Finding                 │   │
│  │ + normalize_ssl_finding(result: dict) → Finding                     │   │
│  │ + deduplicate(findings: List[Finding]) → List[Finding]             │   │
│  │ + _generate_fingerprint(finding: Finding) → str                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        ReportGenerator                               │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ - template_engine: Jinja2                                           │   │
│  │ - pdf_renderer: WeasyPrint                                          │   │
│  │ - storage: S3Storage                                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ + generate_html_report(scan: Scan) → str                           │   │
│  │ + generate_pdf_report(scan: Scan) → bytes                          │   │
│  │ + generate_executive_summary(scan: Scan) → dict                    │   │
│  │ + generate_owasp_compliance(findings: List) → dict                 │   │
│  │ + save_report(scan_id: UUID, pdf: bytes) → str                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Sequence Diagrams

### 5.1 Scan Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCAN EXECUTION SEQUENCE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User      API       Queue      Worker     ZAP      Nuclei     DB          │
│   │         │          │          │         │         │         │           │
│   │ POST /scans        │          │         │         │         │           │
│   │────────▶│          │          │         │         │         │           │
│   │         │          │          │         │         │         │           │
│   │         │ Validate quota      │         │         │         │           │
│   │         │──────────────────────────────────────────────────▶│           │
│   │         │          │          │         │         │        │           │
│   │         │ Create scan record  │         │         │        │           │
│   │         │──────────────────────────────────────────────────▶│           │
│   │         │          │          │         │         │         │           │
│   │         │ Enqueue job         │         │         │         │           │
│   │         │─────────▶│          │         │         │         │           │
│   │         │          │          │         │         │         │           │
│   │◀────────│ Return scan_id      │         │         │         │           │
│   │         │          │          │         │         │         │           │
│   │         │          │ Pick job │         │         │         │           │
│   │         │          │─────────▶│         │         │         │           │
│   │         │          │          │         │         │         │           │
│   │         │          │          │ Update: running   │         │           │
│   │         │          │          │─────────────────────────────▶│           │
│   │         │          │          │         │         │         │           │
│   │         │          │          │ Start ZAP         │         │           │
│   │         │          │          │────────▶│         │         │           │
│   │         │          │          │         │         │         │           │
│   │         │          │          │ Spider  │         │         │           │
│   │         │          │          │────────▶│         │         │           │
│   │         │          │          │◀────────│ URLs    │         │           │
│   │         │          │          │         │         │         │           │
│   │   WS: Progress updates        │         │         │         │           │
│   │◀────────────────────────────────        │         │         │           │
│   │         │          │          │         │         │         │           │
│   │         │          │          │ Passive scan      │         │           │
│   │         │          │          │────────▶│         │         │           │
│   │         │          │          │◀────────│ Alerts  │         │           │
│   │         │          │          │         │         │         │           │
│   │         │          │          │ Active scan       │         │           │
│   │         │          │          │────────▶│         │         │           │
│   │         │          │          │◀────────│ Alerts  │         │           │
│   │         │          │          │         │         │         │           │
│   │         │          │          │ Nuclei scan       │         │           │
│   │         │          │          │─────────────────▶ │         │           │
│   │         │          │          │◀─────────────────│ Findings│           │
│   │         │          │          │         │         │         │           │
│   │         │          │          │ Normalize findings│         │           │
│   │         │          │          │─────────────────────────────▶│           │
│   │         │          │          │         │         │         │           │
│   │         │          │          │ Generate report   │         │           │
│   │         │          │          │─────────────────────────────▶│           │
│   │         │          │          │         │         │         │           │
│   │         │          │          │ Update: completed │         │           │
│   │         │          │          │─────────────────────────────▶│           │
│   │         │          │          │         │         │         │           │
│   │   WS: Scan completed          │         │         │         │           │
│   │◀────────────────────────────────        │         │         │           │
│   │         │          │          │         │         │         │           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Algorithm Specifications

### 6.1 Risk Score Calculation

```python
def calculate_risk_score(findings: List[Finding]) -> str:
    """
    Calculate overall risk score from findings.
    
    Scoring weights:
    - Critical: 40 points each
    - High: 20 points each
    - Medium: 5 points each
    - Low: 1 point each
    - Info: 0 points
    
    Score thresholds:
    - A: 0-5 points (Excellent)
    - B: 6-15 points (Good)
    - C: 16-40 points (Fair)
    - D: 41-80 points (Poor)
    - F: 81+ points (Critical)
    """
    
    WEIGHTS = {
        'critical': 40,
        'high': 20,
        'medium': 5,
        'low': 1,
        'info': 0
    }
    
    total_score = sum(
        WEIGHTS.get(f.severity, 0) 
        for f in findings
    )
    
    if total_score <= 5:
        return 'A'
    elif total_score <= 15:
        return 'B'
    elif total_score <= 40:
        return 'C'
    elif total_score <= 80:
        return 'D'
    else:
        return 'F'
```

### 6.2 Finding Deduplication

```python
def deduplicate_findings(findings: List[Finding]) -> List[Finding]:
    """
    Remove duplicate findings based on fingerprint.
    Keep the finding with highest confidence.
    """
    
    seen = {}  # fingerprint -> Finding
    
    for finding in findings:
        fingerprint = generate_fingerprint(finding)
        
        if fingerprint not in seen:
            seen[fingerprint] = finding
        else:
            # Keep higher confidence finding
            existing = seen[fingerprint]
            if CONFIDENCE_ORDER[finding.confidence] > \
               CONFIDENCE_ORDER[existing.confidence]:
                seen[fingerprint] = finding
    
    return list(seen.values())


def generate_fingerprint(finding: Finding) -> str:
    """
    Generate unique fingerprint for finding deduplication.
    """
    components = [
        finding.cwe_id or '',
        finding.affected_url or '',
        finding.affected_parameter or '',
        finding.title
    ]
    
    fingerprint_str = '|'.join(components)
    return hashlib.sha256(fingerprint_str.encode()).hexdigest()[:16]
```

### 6.3 URL Coverage Tracking

```python
class CoverageTracker:
    """Track scan coverage for transparency."""
    
    def __init__(self, scan_id: str):
        self.scan_id = scan_id
        self.urls = {}  # url -> URLStatus
        self.discovery_sources = {}  # url -> source
        
    def register_discovered(self, url: str, source: str):
        """Register newly discovered URL."""
        if url not in self.urls:
            self.urls[url] = URLStatus(
                url=url,
                status='pending',
                discovered_from=source
            )
            self.discovery_sources[url] = source
    
    def mark_scanned(self, url: str, tests: List[str]):
        """Mark URL as scanned."""
        if url in self.urls:
            self.urls[url].status = 'scanned'
            self.urls[url].tests_run = tests
            self.urls[url].scanned_at = datetime.utcnow()
    
    def mark_skipped(self, url: str, reason: str):
        """Mark URL as skipped with reason."""
        if url in self.urls:
            self.urls[url].status = 'skipped'
            self.urls[url].skip_reason = reason
    
    def get_coverage_percentage(self) -> float:
        """Calculate coverage percentage."""
        total = len(self.urls)
        if total == 0:
            return 0.0
        
        scanned = sum(1 for u in self.urls.values() 
                      if u.status == 'scanned')
        return round((scanned / total) * 100, 1)
    
    def get_skip_reasons_summary(self) -> Dict[str, int]:
        """Get summary of skip reasons."""
        reasons = {}
        for url_status in self.urls.values():
            if url_status.status == 'skipped':
                reason = url_status.skip_reason or 'Unknown'
                reasons[reason] = reasons.get(reason, 0) + 1
        return reasons
```

---

## 7. Error Handling

### 7.1 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message in Vietnamese",
    "details": {},
    "request_id": "req_abc123"
  }
}
```

### 7.2 Error Codes

| Code | HTTP Status | Message (VI) |
|------|-------------|--------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Email hoặc mật khẩu không đúng |
| `AUTH_TOKEN_EXPIRED` | 401 | Phiên đăng nhập đã hết hạn |
| `AUTH_ACCOUNT_LOCKED` | 403 | Tài khoản đã bị khóa |
| `DOMAIN_NOT_VERIFIED` | 400 | Domain chưa được xác minh |
| `DOMAIN_BLACKLISTED` | 400 | Domain này không được phép scan |
| `SCAN_QUOTA_EXCEEDED` | 402 | Bạn đã hết lượt scan tháng này |
| `SCAN_ALREADY_RUNNING` | 409 | Domain này đang được scan |
| `SCAN_NOT_FOUND` | 404 | Không tìm thấy scan |
| `VALIDATION_ERROR` | 400 | Dữ liệu không hợp lệ |
| `INTERNAL_ERROR` | 500 | Lỗi hệ thống |

### 7.3 Retry Strategy

```python
RETRY_CONFIG = {
    'scan_execution': {
        'max_retries': 2,
        'retry_delay_seconds': 60,
        'retry_on': ['connection_error', 'timeout']
    },
    'external_api': {
        'max_retries': 3,
        'retry_delay_seconds': 5,
        'exponential_backoff': True
    },
    'email_sending': {
        'max_retries': 3,
        'retry_delay_seconds': 30
    }
}
```

---

## 8. Configuration Management

### 8.1 Environment Variables

```bash
# Application
APP_ENV=production
APP_DEBUG=false
APP_SECRET_KEY=your-secret-key
APP_URL=https://securescan.vn
API_URL=https://api.securescan.vn

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/securescan
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1

# Storage
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=securescan-reports

# Email
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@securescan.vn

# Scanners
ZAP_API_URL=http://localhost:8080
ZAP_API_KEY=your-zap-key
NUCLEI_TEMPLATES_PATH=/opt/nuclei-templates

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 8.2 Feature Flags

```python
FEATURE_FLAGS = {
    'scheduled_scans': {
        'enabled': True,
        'plans': ['pro', 'agency']
    },
    'api_access': {
        'enabled': True,
        'plans': ['pro', 'agency']
    },
    'white_label_reports': {
        'enabled': False,
        'plans': ['agency']
    },
    'authenticated_scanning': {
        'enabled': False,
        'plans': ['pro', 'agency']
    }
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```python
# tests/test_risk_calculator.py

import pytest
from app.services.risk_calculator import calculate_risk_score
from app.models import Finding

class TestRiskCalculator:
    
    def test_no_findings_returns_A(self):
        assert calculate_risk_score([]) == 'A'
    
    def test_one_critical_returns_D(self):
        findings = [Finding(severity='critical')]
        assert calculate_risk_score(findings) == 'D'
    
    def test_multiple_critical_returns_F(self):
        findings = [Finding(severity='critical') for _ in range(3)]
        assert calculate_risk_score(findings) == 'F'
    
    def test_mixed_severity(self):
        findings = [
            Finding(severity='high'),
            Finding(severity='medium'),
            Finding(severity='low')
        ]
        # 20 + 5 + 1 = 26 → C
        assert calculate_risk_score(findings) == 'C'
```

### 9.2 Integration Tests

```python
# tests/integration/test_scan_workflow.py

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_complete_scan_workflow(client: AsyncClient, auth_token: str):
    # 1. Add domain
    response = await client.post(
        '/api/v1/domains',
        json={'url': 'https://test-target.com'},
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 201
    domain_id = response.json()['data']['id']
    
    # 2. Verify domain (mock)
    # ...
    
    # 3. Create scan
    response = await client.post(
        '/api/v1/scans',
        json={'domain_id': domain_id},
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 201
    scan_id = response.json()['data']['id']
    
    # 4. Wait for completion (in real test, poll or use webhook)
    # ...
    
    # 5. Get results
    response = await client.get(
        f'/api/v1/scans/{scan_id}',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    assert response.json()['data']['status'] == 'completed'
```

### 9.3 Load Tests

```yaml
# k6/scan_load_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 50 },   // Stay at 50
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% < 500ms
    http_req_failed: ['rate<0.01'],    // <1% errors
  },
};

export default function () {
  let response = http.get('https://api.securescan.vn/api/v1/scans', {
    headers: { 'Authorization': 'Bearer ' + __ENV.TOKEN },
  });
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

---

## 10. Appendices

### Appendix A: Project Structure

```
securescan/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── domains.py
│   │   │   ├── scans.py
│   │   │   ├── reports.py
│   │   │   └── users.py
│   │   └── deps.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── exceptions.py
│   ├── models/
│   │   ├── user.py
│   │   ├── domain.py
│   │   ├── scan.py
│   │   └── finding.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── domain.py
│   │   ├── scan.py
│   │   └── finding.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── domain_service.py
│   │   ├── scan_service.py
│   │   └── report_service.py
│   ├── scanners/
│   │   ├── orchestrator.py
│   │   ├── zap_scanner.py
│   │   ├── nuclei_scanner.py
│   │   ├── ssl_checker.py
│   │   └── header_checker.py
│   ├── workers/
│   │   ├── scan_worker.py
│   │   └── scheduler.py
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.worker
│   └── docker-compose.yml
├── docs/
├── scripts/
└── README.md
```

### Appendix B: Vietnamese Translations Database Structure

```python
VIETNAMESE_FINDINGS_DB = {
    # ZAP Rule ID -> Vietnamese content
    "40012": {
        "title": "Cross-Site Scripting (Phản xạ)",
        "description": "Lỗ hổng XSS cho phép...",
        "solution": "**Cách khắc phục:**\n1. Mã hóa output...",
    },
    "40018": {
        "title": "SQL Injection",
        "description": "Lỗ hổng SQL Injection...",
        "solution": "**Cách khắc phục:**\n1. Sử dụng Prepared Statements...",
    },
    # ... more rules
}

OWASP_CATEGORIES_VI = {
    "A01:2025": "Kiểm soát truy cập bị lỗi",
    "A02:2025": "Cấu hình bảo mật sai",
    "A03:2025": "Lỗi chuỗi cung ứng phần mềm",
    "A04:2025": "Lỗi mã hóa",
    "A05:2025": "Injection",
    "A06:2025": "Thiết kế không an toàn",
    "A07:2025": "Lỗi xác thực",
    "A08:2025": "Lỗi toàn vẹn phần mềm và dữ liệu",
    "A09:2025": "Lỗi ghi log và giám sát",
    "A10:2025": "Xử lý điều kiện bất thường sai",
}

SEVERITY_VI = {
    "critical": "Nghiêm trọng",
    "high": "Cao",
    "medium": "Trung bình",
    "low": "Thấp",
    "info": "Thông tin",
}

RISK_SCORE_VI = {
    "A": "Xuất sắc - Website an toàn",
    "B": "Tốt - Một số cải thiện nhỏ cần thiết",
    "C": "Trung bình - Cần cải thiện",
    "D": "Kém - Nhiều lỗ hổng cần fix",
    "F": "Nghiêm trọng - Cần hành động ngay",
}
```

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tech Lead | | | |
| Senior Developer | | | |
| QA Lead | | | |
