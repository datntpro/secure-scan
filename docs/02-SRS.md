# Software Requirements Specification (SRS)
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

Tài liệu này mô tả chi tiết các yêu cầu phần mềm cho hệ thống SecureScan.vn, bao gồm functional requirements, non-functional requirements, và system constraints.

### 1.2 Scope

SecureScan.vn là một web-based SaaS platform cung cấp:
- Automated vulnerability scanning cho websites
- Security reports tiếng Việt
- Remediation guidance
- Continuous monitoring capabilities

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|------------|
| **DAST** | Dynamic Application Security Testing |
| **SAST** | Static Application Security Testing |
| **API** | Application Programming Interface |
| **JWT** | JSON Web Token |
| **RBAC** | Role-Based Access Control |
| **SPA** | Single Page Application |

### 1.4 References

- OWASP Top 10:2025
- OWASP Testing Guide v4.2
- CWE/SANS Top 25
- NIST Cybersecurity Framework

---

## 2. Overall Description

### 2.1 Product Perspective

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM CONTEXT DIAGRAM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                         ┌─────────────┐                         │
│                         │   User      │                         │
│                         │  Browser    │                         │
│                         └──────┬──────┘                         │
│                                │                                 │
│                                ▼                                 │
│                    ┌───────────────────────┐                    │
│                    │   SecureScan.vn       │                    │
│                    │   ┌───────────────┐   │                    │
│                    │   │  Web App      │   │                    │
│                    │   └───────┬───────┘   │                    │
│                    │           │           │                    │
│                    │   ┌───────▼───────┐   │                    │
│                    │   │  API Server   │   │                    │
│                    │   └───────┬───────┘   │                    │
│                    │           │           │                    │
│                    │   ┌───────▼───────┐   │                    │
│                    │   │ Scan Engine   │   │                    │
│                    │   └───────────────┘   │                    │
│                    └───────────┬───────────┘                    │
│                                │                                 │
│              ┌─────────────────┼─────────────────┐              │
│              ▼                 ▼                 ▼              │
│      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│      │   Target    │   │  External   │   │   Email     │       │
│      │   Website   │   │   APIs      │   │   Service   │       │
│      └─────────────┘   └─────────────┘   └─────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Product Functions

| Function Group | Functions |
|----------------|-----------|
| **User Management** | Registration, Authentication, Profile, Billing |
| **Scan Management** | Create scan, Configure scan, Execute scan, View results |
| **Reporting** | Generate reports, Export PDF, Email reports |
| **Monitoring** | Scheduled scans, Alerts, Trends |
| **Administration** | User management, System config, Audit logs |

### 2.3 User Classes and Characteristics

| User Class | Characteristics | Technical Level |
|------------|-----------------|-----------------|
| **Free User** | Trial user, 1 scan/month | Low |
| **Starter User** | Small business owner | Low-Medium |
| **Pro User** | IT staff, Developer | Medium-High |
| **Agency User** | Multiple clients, team | High |
| **Admin** | System administrator | High |

### 2.4 Operating Environment

| Component | Requirement |
|-----------|-------------|
| **Client Browser** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| **Server OS** | Ubuntu 24.04 LTS |
| **Runtime** | Python 3.11+, Node.js 20+ |
| **Database** | PostgreSQL 15+ |
| **Cache** | Redis 7+ |
| **Container** | Docker 24+ |

### 2.5 Constraints

| Constraint Type | Description |
|-----------------|-------------|
| **Regulatory** | Comply with PDPD 2023 (Vietnam) |
| **Security** | No scanning without domain verification |
| **Performance** | Scan must complete within 60 minutes |
| **Budget** | Infrastructure cost <$100/month initially |
| **Timeline** | MVP trong 6-8 tuần |

---

## 3. Functional Requirements

### 3.1 User Management Module

#### FR-UM-001: User Registration
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-UM-001 |
| **Title** | User Registration |
| **Priority** | Must Have |
| **Description** | User có thể đăng ký tài khoản mới |
| **Input** | Email, Password, Full Name |
| **Process** | Validate input → Create account → Send verification email |
| **Output** | Account created, Verification email sent |
| **Business Rules** | - Email phải unique<br>- Password min 8 chars, 1 uppercase, 1 number<br>- Email verification required |

#### FR-UM-002: User Login
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-UM-002 |
| **Title** | User Login |
| **Priority** | Must Have |
| **Description** | User có thể đăng nhập vào hệ thống |
| **Input** | Email, Password |
| **Process** | Validate credentials → Generate JWT → Create session |
| **Output** | JWT token, Redirect to dashboard |
| **Business Rules** | - Lock account sau 5 failed attempts<br>- JWT expires in 24h<br>- Refresh token expires in 7 days |

#### FR-UM-003: Password Reset
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-UM-003 |
| **Title** | Password Reset |
| **Priority** | Must Have |
| **Description** | User có thể reset password nếu quên |
| **Input** | Email |
| **Process** | Verify email → Send reset link → User sets new password |
| **Output** | Password updated |
| **Business Rules** | - Reset link expires in 1 hour<br>- One-time use link |

#### FR-UM-004: Profile Management
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-UM-004 |
| **Title** | Profile Management |
| **Priority** | Should Have |
| **Description** | User có thể update profile information |
| **Input** | Name, Company, Phone, Timezone |
| **Process** | Validate → Update database |
| **Output** | Profile updated |

#### FR-UM-005: Subscription Management
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-UM-005 |
| **Title** | Subscription Management |
| **Priority** | Must Have |
| **Description** | User có thể upgrade/downgrade/cancel subscription |
| **Input** | Plan selection, Payment info |
| **Process** | Process payment → Update subscription → Send confirmation |
| **Output** | Subscription updated |
| **Business Rules** | - Prorated billing for upgrades<br>- Downgrade effective next billing cycle |

---

### 3.2 Domain Management Module

#### FR-DM-001: Add Domain
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-DM-001 |
| **Title** | Add Domain |
| **Priority** | Must Have |
| **Description** | User có thể add domain để scan |
| **Input** | Domain URL |
| **Process** | Validate URL → Check blacklist → Add to pending verification |
| **Output** | Domain added, Verification instructions shown |
| **Business Rules** | - Must be valid URL format<br>- Cannot be in blacklist (gov, bank, etc.) |

#### FR-DM-002: Verify Domain Ownership
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-DM-002 |
| **Title** | Domain Verification |
| **Priority** | Must Have |
| **Description** | User phải verify ownership trước khi scan |
| **Input** | Verification method selection |
| **Process** | Check DNS TXT record OR Check file upload |
| **Output** | Domain verified/not verified |
| **Verification Methods** | 1. DNS TXT Record: Add `securescan-verify=<token>` to DNS<br>2. File Upload: Upload `securescan-verify.txt` to root |

#### FR-DM-003: List Domains
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-DM-003 |
| **Title** | List Domains |
| **Priority** | Must Have |
| **Description** | User có thể xem list tất cả domains của mình |
| **Output** | List domains với status (verified/pending/expired) |

#### FR-DM-004: Remove Domain
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-DM-004 |
| **Title** | Remove Domain |
| **Priority** | Should Have |
| **Description** | User có thể remove domain khỏi account |
| **Business Rules** | - Cannot remove domain with running scan<br>- Historical data retained for 30 days |

---

### 3.3 Scan Management Module

#### FR-SM-001: Create New Scan
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-SM-001 |
| **Title** | Create New Scan |
| **Priority** | Must Have |
| **Description** | User có thể tạo scan mới cho verified domain |
| **Input** | Domain selection, Scan profile (optional) |
| **Process** | Validate quota → Queue scan → Start execution |
| **Output** | Scan created, Scan ID returned |
| **Business Rules** | - Domain must be verified<br>- User must have available scan quota<br>- Cannot have 2 scans running same domain |

#### FR-SM-002: Configure Scan Profile
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-SM-002 |
| **Title** | Configure Scan Profile |
| **Priority** | Should Have (Pro+) |
| **Description** | User có thể customize scan parameters |
| **Input** | Scan depth, Excluded paths, Authentication credentials |
| **Options** | - Scan depth: 1-10 levels<br>- Speed: Fast/Normal/Thorough<br>- Auth: None/Basic/Form-based |

#### FR-SM-003: View Scan Progress
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-SM-003 |
| **Title** | Real-time Scan Progress |
| **Priority** | Must Have |
| **Description** | User có thể xem progress của scan đang chạy |
| **Output** | Progress %, Current phase, URLs discovered, URLs scanned |
| **Update Frequency** | Every 5 seconds via WebSocket |

#### FR-SM-004: Cancel Scan
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-SM-004 |
| **Title** | Cancel Running Scan |
| **Priority** | Should Have |
| **Description** | User có thể cancel scan đang chạy |
| **Business Rules** | - Partial results saved<br>- Scan quota not refunded |

#### FR-SM-005: View Scan History
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-SM-005 |
| **Title** | Scan History |
| **Priority** | Must Have |
| **Description** | User có thể xem history tất cả scans |
| **Output** | List scans với date, status, findings count |
| **Filters** | Date range, Domain, Status |

#### FR-SM-006: Schedule Recurring Scan
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-SM-006 |
| **Title** | Scheduled Scans |
| **Priority** | Should Have (Pro+) |
| **Description** | User có thể schedule scan chạy tự động |
| **Options** | Daily, Weekly, Monthly |
| **Business Rules** | - Max 1 scheduled scan per domain (Starter)<br>- Max 5 per domain (Pro+) |

---

### 3.4 Scan Engine Module

#### FR-SE-001: URL Discovery
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-SE-001 |
| **Title** | URL Discovery |
| **Priority** | Must Have |
| **Description** | Engine phải discover tất cả URLs có thể trên target |
| **Methods** | 1. Spider/Crawl<br>2. Sitemap.xml parsing<br>3. Robots.txt parsing<br>4. JavaScript analysis<br>5. Common paths check |
| **Output** | List of discovered URLs với source |

#### FR-SE-002: Vulnerability Scanning
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-SE-002 |
| **Title** | Vulnerability Scanning |
| **Priority** | Must Have |
| **Description** | Engine phải scan các vulnerability types |
| **Scan Types** | See section 3.4.1 |

##### 3.4.1 Vulnerability Types to Detect

| Category | Vulnerabilities | Tools/Method |
|----------|----------------|--------------|
| **Injection** | SQL Injection, XSS, Command Injection, LDAP Injection, XXE | OWASP ZAP Active Scan |
| **Authentication** | Weak passwords, Session issues, Missing MFA indicators | ZAP + Custom checks |
| **Configuration** | Security headers, SSL/TLS issues, Directory listing, Verbose errors | Custom scripts + SSL Labs API |
| **Information Disclosure** | Server version, Stack traces, Sensitive files (.git, .env) | Nuclei templates |
| **Known CVEs** | Outdated software, Known vulnerabilities | Nuclei CVE templates |
| **Access Control** | IDOR indicators, Path traversal | ZAP + Nuclei |

#### FR-SE-003: SSL/TLS Analysis
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-SE-003 |
| **Title** | SSL/TLS Analysis |
| **Priority** | Must Have |
| **Description** | Engine phải analyze SSL/TLS configuration |
| **Checks** | - Certificate validity<br>- Certificate chain<br>- Protocol versions (TLS 1.2+)<br>- Cipher suites<br>- HSTS header |
| **Output** | SSL Grade (A-F), Detailed findings |

#### FR-SE-004: Security Headers Analysis
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-SE-004 |
| **Title** | Security Headers Analysis |
| **Priority** | Must Have |
| **Description** | Engine phải check security headers |
| **Headers Checked** | - Strict-Transport-Security<br>- X-Content-Type-Options<br>- X-Frame-Options<br>- Content-Security-Policy<br>- X-XSS-Protection<br>- Referrer-Policy<br>- Permissions-Policy |

#### FR-SE-005: Technology Detection
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-SE-005 |
| **Title** | Technology Stack Detection |
| **Priority** | Should Have |
| **Description** | Engine phải detect technologies được sử dụng |
| **Output** | List: CMS, Framework, Server, Libraries với versions |

---

### 3.5 Reporting Module

#### FR-RP-001: Generate Scan Report
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-RP-001 |
| **Title** | Generate Scan Report |
| **Priority** | Must Have |
| **Description** | System phải generate detailed report sau scan |
| **Report Sections** | 1. Executive Summary<br>2. Coverage Report<br>3. Findings by Severity<br>4. OWASP Top 10 Mapping<br>5. Detailed Findings<br>6. Remediation Guide<br>7. Appendix: Full URL List |
| **Languages** | Vietnamese (default), English (optional) |

#### FR-RP-002: Export PDF Report
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-RP-002 |
| **Title** | Export PDF Report |
| **Priority** | Must Have |
| **Description** | User có thể download report dạng PDF |
| **Format** | A4, Professional styling, Company branding (Pro+) |

#### FR-RP-003: Email Report
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-RP-003 |
| **Title** | Email Report |
| **Priority** | Should Have |
| **Description** | System có thể email report khi scan complete |
| **Options** | Send to owner, Send to additional emails |

#### FR-RP-004: White-label Report
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-RP-004 |
| **Title** | White-label Report |
| **Priority** | Could Have (Agency) |
| **Description** | Agency users có thể customize report branding |
| **Customizable** | Logo, Company name, Colors, Contact info |

#### FR-RP-005: Comparison Report
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-RP-005 |
| **Title** | Scan Comparison Report |
| **Priority** | Should Have (Pro+) |
| **Description** | Compare 2 scans của cùng domain |
| **Output** | New findings, Fixed findings, Unchanged findings |

---

### 3.6 Alert & Notification Module

#### FR-AN-001: Email Notifications
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-AN-001 |
| **Title** | Email Notifications |
| **Priority** | Must Have |
| **Description** | System phải send email notifications |
| **Triggers** | - Scan completed<br>- New critical/high finding<br>- Scheduled scan failed<br>- Subscription expiring |

#### FR-AN-002: In-app Notifications
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-AN-002 |
| **Title** | In-app Notifications |
| **Priority** | Should Have |
| **Description** | Real-time notifications trong app |
| **Delivery** | WebSocket push |

#### FR-AN-003: Zalo/Telegram Integration
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-AN-003 |
| **Title** | Messaging App Integration |
| **Priority** | Could Have |
| **Description** | Notifications qua Zalo hoặc Telegram |

---

### 3.7 API Module

#### FR-API-001: RESTful API
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-API-001 |
| **Title** | RESTful API |
| **Priority** | Should Have (Pro+) |
| **Description** | Public API cho integration |
| **Authentication** | API Key + Secret |
| **Rate Limits** | 100 requests/minute (Pro), 500/minute (Agency) |

#### FR-API-002: Webhook Support
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-API-002 |
| **Title** | Webhook Support |
| **Priority** | Could Have |
| **Description** | Webhook notifications cho events |
| **Events** | scan.started, scan.completed, scan.failed, finding.new |

---

### 3.8 Administration Module

#### FR-AD-001: User Administration
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-AD-001 |
| **Title** | User Administration |
| **Priority** | Must Have |
| **Description** | Admin có thể manage users |
| **Functions** | View users, Disable/Enable, Change plan, View activity |

#### FR-AD-002: System Monitoring
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-AD-002 |
| **Title** | System Monitoring Dashboard |
| **Priority** | Must Have |
| **Description** | Admin dashboard cho system health |
| **Metrics** | Active scans, Queue length, Error rate, Resource usage |

#### FR-AD-003: Audit Logging
| Attribute | Description |
|-----------|-------------|
| **ID** | FR-AD-003 |
| **Title** | Audit Logging |
| **Priority** | Must Have |
| **Description** | Log tất cả sensitive actions |
| **Logged Actions** | Login, Scan created, Report downloaded, Settings changed |

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| **NFR-P-001** | Page load time | <3 seconds | Must Have |
| **NFR-P-002** | API response time | <500ms (95th percentile) | Must Have |
| **NFR-P-003** | Scan start time (after queue) | <2 minutes | Must Have |
| **NFR-P-004** | Concurrent scans supported | 50+ | Must Have |
| **NFR-P-005** | Concurrent users supported | 500+ | Should Have |
| **NFR-P-006** | Report generation time | <30 seconds | Must Have |

### 4.2 Scalability Requirements

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| **NFR-S-001** | Horizontal scaling | Add workers without downtime | Must Have |
| **NFR-S-002** | Database scaling | Support 1M+ scan records | Should Have |
| **NFR-S-003** | Storage scaling | Auto-scale for reports | Must Have |

### 4.3 Availability Requirements

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| **NFR-A-001** | System uptime | 99.5% | Must Have |
| **NFR-A-002** | Planned maintenance window | <4 hours/month | Should Have |
| **NFR-A-003** | Recovery Time Objective (RTO) | <4 hours | Must Have |
| **NFR-A-004** | Recovery Point Objective (RPO) | <1 hour | Must Have |

### 4.4 Security Requirements

| ID | Requirement | Description | Priority |
|----|-------------|-------------|----------|
| **NFR-SEC-001** | Data encryption at rest | AES-256 | Must Have |
| **NFR-SEC-002** | Data encryption in transit | TLS 1.3 | Must Have |
| **NFR-SEC-003** | Password hashing | bcrypt with cost factor 12 | Must Have |
| **NFR-SEC-004** | SQL injection prevention | Parameterized queries only | Must Have |
| **NFR-SEC-005** | XSS prevention | Input sanitization, CSP headers | Must Have |
| **NFR-SEC-006** | CSRF protection | CSRF tokens on all forms | Must Have |
| **NFR-SEC-007** | Rate limiting | Prevent brute force attacks | Must Have |
| **NFR-SEC-008** | Secrets management | No hardcoded secrets | Must Have |
| **NFR-SEC-009** | Security audit logging | All sensitive actions logged | Must Have |
| **NFR-SEC-010** | Vulnerability scanning of own system | Monthly | Should Have |

### 4.5 Usability Requirements

| ID | Requirement | Description | Priority |
|----|-------------|-------------|----------|
| **NFR-U-001** | Language support | Vietnamese (primary), English | Must Have |
| **NFR-U-002** | Mobile responsive | Support mobile browsers | Must Have |
| **NFR-U-003** | Accessibility | WCAG 2.1 Level A | Should Have |
| **NFR-U-004** | First scan completion | <15 minutes from signup | Must Have |
| **NFR-U-005** | Help documentation | Vietnamese documentation | Must Have |
| **NFR-U-006** | Error messages | Clear, actionable, Vietnamese | Must Have |

### 4.6 Reliability Requirements

| ID | Requirement | Description | Priority |
|----|-------------|-------------|----------|
| **NFR-R-001** | Scan completion rate | >95% scans complete successfully | Must Have |
| **NFR-R-002** | Data integrity | No data loss during scans | Must Have |
| **NFR-R-003** | Graceful degradation | Partial service during failures | Should Have |
| **NFR-R-004** | Automatic retry | Failed scans auto-retry once | Should Have |

### 4.7 Maintainability Requirements

| ID | Requirement | Description | Priority |
|----|-------------|-------------|----------|
| **NFR-M-001** | Code documentation | All public APIs documented | Must Have |
| **NFR-M-002** | Test coverage | >70% unit test coverage | Should Have |
| **NFR-M-003** | Deployment automation | CI/CD pipeline | Must Have |
| **NFR-M-004** | Monitoring & alerting | Centralized logging, alerts | Must Have |
| **NFR-M-005** | Configuration management | Environment-based configs | Must Have |

### 4.8 Compliance Requirements

| ID | Requirement | Standard | Priority |
|----|-------------|----------|----------|
| **NFR-C-001** | Data protection | PDPD 2023 (Vietnam) | Must Have |
| **NFR-C-002** | Security standards | OWASP Top 10 compliance | Must Have |
| **NFR-C-003** | Report standards | OWASP, CWE, CVE references | Must Have |
| **NFR-C-004** | Data retention | Configurable, default 90 days | Should Have |

---

## 5. External Interface Requirements

### 5.1 User Interfaces

#### 5.1.1 Web Application
- **Type**: Single Page Application (SPA)
- **Framework**: React/Next.js
- **Responsive**: Yes, mobile-first
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

#### 5.1.2 Key Screens

| Screen | Description | Priority |
|--------|-------------|----------|
| Landing Page | Marketing, pricing, signup | Must Have |
| Dashboard | Overview, recent scans, alerts | Must Have |
| Scan Creation | Domain input, config options | Must Have |
| Scan Progress | Real-time progress view | Must Have |
| Scan Results | Findings list, details, filters | Must Have |
| Report View | Full report với export options | Must Have |
| Domain Management | List, add, verify domains | Must Have |
| Settings | Profile, billing, notifications | Must Have |
| Admin Dashboard | User management, system stats | Must Have |

### 5.2 Hardware Interfaces

Không có hardware interfaces trực tiếp. System chạy trên cloud infrastructure.

### 5.3 Software Interfaces

| Interface | Type | Purpose |
|-----------|------|---------|
| PostgreSQL | Database | Primary data storage |
| Redis | Cache/Queue | Caching, job queue |
| OWASP ZAP | Scanner | DAST scanning |
| Nuclei | Scanner | CVE/Template scanning |
| SSL Labs API | External API | SSL analysis |
| Stripe | Payment Gateway | Payment processing |
| SendGrid/SES | Email Service | Transactional emails |
| S3-compatible | Object Storage | Report storage |

### 5.4 Communication Interfaces

| Protocol | Usage |
|----------|-------|
| HTTPS | All web traffic |
| WSS | Real-time updates (scan progress) |
| SMTP/API | Email delivery |
| Webhook | Event notifications to external systems |

---

## 6. Data Requirements

### 6.1 Data Entities

#### 6.1.1 User
```
User {
    id: UUID (PK)
    email: VARCHAR(255) UNIQUE
    password_hash: VARCHAR(255)
    full_name: VARCHAR(100)
    company: VARCHAR(100)
    phone: VARCHAR(20)
    timezone: VARCHAR(50)
    role: ENUM('user', 'admin')
    subscription_tier: ENUM('free', 'starter', 'pro', 'agency')
    subscription_status: ENUM('active', 'cancelled', 'past_due')
    email_verified: BOOLEAN
    created_at: TIMESTAMP
    updated_at: TIMESTAMP
    last_login_at: TIMESTAMP
}
```

#### 6.1.2 Domain
```
Domain {
    id: UUID (PK)
    user_id: UUID (FK -> User)
    url: VARCHAR(255)
    verification_status: ENUM('pending', 'verified', 'expired')
    verification_method: ENUM('dns', 'file')
    verification_token: VARCHAR(64)
    verified_at: TIMESTAMP
    created_at: TIMESTAMP
}
```

#### 6.1.3 Scan
```
Scan {
    id: UUID (PK)
    user_id: UUID (FK -> User)
    domain_id: UUID (FK -> Domain)
    status: ENUM('queued', 'running', 'completed', 'failed', 'cancelled')
    scan_type: ENUM('quick', 'standard', 'thorough')
    progress: INTEGER (0-100)
    started_at: TIMESTAMP
    completed_at: TIMESTAMP
    created_at: TIMESTAMP
    
    -- Coverage metrics
    urls_discovered: INTEGER
    urls_scanned: INTEGER
    urls_skipped: INTEGER
    
    -- Results summary
    findings_critical: INTEGER
    findings_high: INTEGER
    findings_medium: INTEGER
    findings_low: INTEGER
    findings_info: INTEGER
    
    risk_score: VARCHAR(2) -- A, B, C, D, F
}
```

#### 6.1.4 Finding
```
Finding {
    id: UUID (PK)
    scan_id: UUID (FK -> Scan)
    title: VARCHAR(255)
    title_vi: VARCHAR(255)
    severity: ENUM('critical', 'high', 'medium', 'low', 'info')
    confidence: ENUM('confirmed', 'high', 'medium', 'low')
    
    owasp_category: VARCHAR(50)
    cwe_id: VARCHAR(20)
    cve_id: VARCHAR(20)
    cvss_score: DECIMAL(3,1)
    
    description: TEXT
    description_vi: TEXT
    url: VARCHAR(2048)
    evidence: TEXT
    
    solution: TEXT
    solution_vi: TEXT
    references: JSONB
    
    source: VARCHAR(50) -- zap, nuclei, custom
    raw_data: JSONB
    
    created_at: TIMESTAMP
}
```

#### 6.1.5 ScanLog
```
ScanLog {
    id: UUID (PK)
    scan_id: UUID (FK -> Scan)
    level: ENUM('debug', 'info', 'warn', 'error')
    message: TEXT
    data: JSONB
    created_at: TIMESTAMP
}
```

### 6.2 Data Retention

| Data Type | Retention Period | Notes |
|-----------|------------------|-------|
| User accounts | Until deletion request | Soft delete, hard delete after 30 days |
| Scan results | 90 days default | Configurable per user |
| Scan logs | 30 days | Compressed after 7 days |
| Audit logs | 1 year | Compliance requirement |
| Reports (PDF) | 90 days | Same as scan results |

### 6.3 Data Backup

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Full database backup | Daily | 30 days |
| Transaction logs | Continuous | 7 days |
| Report files | Daily | 30 days |

---

## 7. Quality Attributes

### 7.1 Quality Attribute Scenarios

#### Performance Scenario
```
Source: User
Stimulus: Initiates a scan
Environment: Normal operation, 20 concurrent scans
Response: Scan starts within 2 minutes
Measure: 95% of scans start within 2 minutes
```

#### Availability Scenario
```
Source: System
Stimulus: Database server fails
Environment: Normal operation
Response: System fails over to replica
Measure: Failover completes within 30 seconds
```

#### Security Scenario
```
Source: Attacker
Stimulus: Attempts SQL injection on login form
Environment: Normal operation
Response: Attack blocked, logged, IP rate-limited
Measure: Zero successful injections
```

#### Usability Scenario
```
Source: New user (non-technical)
Stimulus: Wants to scan their first website
Environment: First visit to platform
Response: User completes first scan
Measure: 80% of users complete first scan within 15 minutes
```

---

## 8. Appendices

### Appendix A: OWASP Top 10:2025 Mapping

| OWASP Category | CWE IDs | Detection Method |
|----------------|---------|------------------|
| A01: Broken Access Control | CWE-22, CWE-284, CWE-639 | ZAP, Nuclei |
| A02: Security Misconfiguration | CWE-16, CWE-200, CWE-548 | Custom scripts |
| A03: Software Supply Chain | CWE-937, CWE-1035 | Nuclei CVE templates |
| A04: Cryptographic Failures | CWE-310, CWE-327 | SSL check, ZAP |
| A05: Injection | CWE-79, CWE-89, CWE-78 | ZAP Active Scan |
| A06: Insecure Design | CWE-602, CWE-656 | Manual review indicators |
| A07: Authentication Failures | CWE-287, CWE-307, CWE-521 | ZAP, Custom |
| A08: Software & Data Integrity | CWE-345, CWE-502 | Nuclei |
| A09: Logging & Alerting Failures | CWE-117, CWE-778 | Indicators only |
| A10: Exceptional Conditions | CWE-754, CWE-755 | Error response analysis |

### Appendix B: API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | User registration |
| POST | /api/v1/auth/login | User login |
| POST | /api/v1/auth/refresh | Refresh token |
| GET | /api/v1/domains | List domains |
| POST | /api/v1/domains | Add domain |
| POST | /api/v1/domains/{id}/verify | Verify domain |
| DELETE | /api/v1/domains/{id} | Remove domain |
| GET | /api/v1/scans | List scans |
| POST | /api/v1/scans | Create scan |
| GET | /api/v1/scans/{id} | Get scan details |
| GET | /api/v1/scans/{id}/progress | Get scan progress |
| POST | /api/v1/scans/{id}/cancel | Cancel scan |
| GET | /api/v1/scans/{id}/findings | Get findings |
| GET | /api/v1/scans/{id}/report | Get report |
| GET | /api/v1/scans/{id}/report/pdf | Download PDF |

### Appendix C: Error Codes

| Code | Message | Description |
|------|---------|-------------|
| AUTH001 | Invalid credentials | Login failed |
| AUTH002 | Token expired | JWT expired |
| AUTH003 | Account locked | Too many failed attempts |
| DOMAIN001 | Invalid URL | URL format invalid |
| DOMAIN002 | Domain not verified | Cannot scan unverified domain |
| DOMAIN003 | Domain blacklisted | Domain in blacklist |
| SCAN001 | Quota exceeded | No scans remaining |
| SCAN002 | Scan already running | Duplicate scan |
| SCAN003 | Scan failed | Internal error |

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
