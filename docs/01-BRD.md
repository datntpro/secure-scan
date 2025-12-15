# Business Requirements Document (BRD)
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

## 1. Executive Summary

### 1.1 Tổng quan dự án

SecureScan.vn là nền tảng SaaS quét lỗ hổng bảo mật website được thiết kế đặc biệt cho doanh nghiệp vừa và nhỏ (SME) tại Việt Nam. Sản phẩm giải quyết khoảng trống thị trường khi các công cụ bảo mật hiện tại quá đắt đỏ, phức tạp và không hỗ trợ tiếng Việt.

### 1.2 Value Proposition

> **"Biết website của bạn có lỗ hổng gì trong 10 phút, không cần hiểu kỹ thuật"**

### 1.3 Tại sao cần dự án này?

- **8,000+ cyberattacks** được báo cáo tại Việt Nam năm 2023
- **SME là mục tiêu chính** của hacker do thiếu đầu tư bảo mật
- **Mức phạt $5,000-$50,000** theo Personal Data Protection Decree 2023
- **Không có giải pháp phù hợp** cho SME Việt Nam (giá rẻ, tiếng Việt, dễ dùng)

---

## 2. Business Context

### 2.1 Phân tích thị trường

#### Quy mô thị trường
| Chỉ số | Giá trị |
|--------|---------|
| Vietnam Apps Market | $912 million USD |
| Vietnam SaaS Market | $156 million USD |
| SME tại Việt Nam | ~800,000 doanh nghiệp |
| Internet penetration | 97% |
| Smartphone adoption | 72% |

#### Đối thủ cạnh tranh

| Tool | Giá/tháng | Ngôn ngữ | Target |
|------|-----------|----------|--------|
| Nessus Pro | $400+ | English | Enterprise |
| Acunetix | $500+ | English | Enterprise |
| Intruder | $157+ | English | Mid-market |
| Qualys | $300+ | English | Enterprise |
| **SecureScan.vn** | **$8-50** | **Tiếng Việt** | **SME VN** |

#### Market Gap

```
┌─────────────────────────────────────────────────────────────┐
│                    MARKET POSITIONING                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   GIÁ CAO │                    Nessus                       │
│           │              Acunetix    Qualys                 │
│           │                                                  │
│           │         Intruder                                │
│           │                                                  │
│           │                                                  │
│   GIÁ     │                        ┌─────────────┐          │
│   TRUNG   │                        │ SecureScan  │          │
│   BÌNH    │                        │    .vn      │          │
│           │                        │  ⭐ GAP     │          │
│           │                        └─────────────┘          │
│   GIÁ     │                                                  │
│   THẤP    │  Free tools (manual, phức tạp)                  │
│           │                                                  │
│           └──────────────────────────────────────────────────│
│             PHỨC TẠP              ĐƠN GIẢN            UX    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Target Customer Segments

#### Primary Segment: Chủ shop online & Startup founders
- **Số lượng**: ~200,000 shops trên Shopee, Lazada, self-hosted
- **Pain points**: Không biết website có an toàn không, sợ bị hack
- **Budget**: 200k-500k VND/tháng
- **Tech level**: Thấp

#### Secondary Segment: IT Manager tại SME
- **Số lượng**: ~50,000 doanh nghiệp có IT staff
- **Pain points**: Cần báo cáo cho leadership, chứng minh compliance
- **Budget**: 500k-2tr VND/tháng
- **Tech level**: Trung bình

#### Tertiary Segment: Freelance developers & Agencies
- **Số lượng**: ~30,000 developers/agencies
- **Pain points**: Cần scan cho nhiều clients, white-label reports
- **Budget**: 1-3tr VND/tháng
- **Tech level**: Cao

---

## 3. Business Objectives

### 3.1 Vision Statement

Trở thành nền tảng bảo mật website #1 cho SME Việt Nam trong vòng 3 năm.

### 3.2 Mission Statement

Giúp mọi doanh nghiệp Việt Nam, bất kể quy mô, có thể bảo vệ website của mình trước các mối đe dọa an ninh mạng với chi phí hợp lý và cách sử dụng đơn giản.

### 3.3 Business Goals

| Goal | Metric | Target Year 1 | Target Year 2 | Target Year 3 |
|------|--------|---------------|---------------|---------------|
| **Revenue** | MRR | 70tr VND | 200tr VND | 500tr VND |
| **Users** | Paid subscribers | 200 | 500 | 1,500 |
| **Market share** | % SME VN dùng vuln scanner | 1% | 3% | 8% |
| **Brand awareness** | Organic traffic/tháng | 5,000 | 20,000 | 50,000 |

### 3.4 Success Metrics (KPIs)

#### Product Metrics
| KPI | Definition | Target |
|-----|------------|--------|
| **Activation Rate** | % users complete first scan | >60% |
| **Time to Value** | Time from signup to first report | <15 phút |
| **Scan Completion Rate** | % scans complete successfully | >95% |
| **False Positive Rate** | % findings incorrectly flagged | <10% |

#### Business Metrics
| KPI | Definition | Target |
|-----|------------|--------|
| **Conversion Rate** | Free → Paid | >5% |
| **Churn Rate** | Monthly churn | <5% |
| **ARPU** | Average Revenue Per User | 350k VND |
| **CAC** | Customer Acquisition Cost | <500k VND |
| **LTV** | Lifetime Value | >2tr VND |
| **NPS** | Net Promoter Score | >40 |

---

## 4. Stakeholders

### 4.1 Internal Stakeholders

| Role | Responsibilities | Success Criteria |
|------|-----------------|------------------|
| **Product Owner** | Product vision, roadmap, prioritization | Đạt business goals |
| **Tech Lead** | Technical architecture, code quality | System uptime >99.5% |
| **Frontend Dev** | UI/UX implementation | User satisfaction |
| **Backend Dev** | API, scan engine, infrastructure | Scan accuracy |
| **DevOps** | CI/CD, monitoring, security | Deployment frequency |

### 4.2 External Stakeholders

| Stakeholder | Interest | Communication |
|-------------|----------|---------------|
| **End Users** | Reliable, accurate scanning | In-app, Email, Zalo |
| **Partners** (Hosting providers) | Integration, referrals | Direct meetings |
| **Regulators** | Compliance, data protection | Compliance reports |
| **Investors** (future) | ROI, growth metrics | Monthly reports |

---

## 5. Business Requirements

### 5.1 Core Business Requirements

| ID | Requirement | Priority | Rationale |
|----|-------------|----------|-----------|
| **BR-001** | Hệ thống phải hỗ trợ 100% tiếng Việt | Must Have | Target market là VN |
| **BR-002** | Giá phải dưới $50/tháng cho tier cao nhất | Must Have | SME budget constraint |
| **BR-003** | User không cần technical knowledge để sử dụng | Must Have | Target user profile |
| **BR-004** | Report phải actionable (hướng dẫn fix cụ thể) | Must Have | Differentiation |
| **BR-005** | Scan phải hoàn thành trong <30 phút | Should Have | User experience |
| **BR-006** | Hỗ trợ trực tiếp qua Zalo/Telegram | Should Have | VN user preference |
| **BR-007** | White-label reports cho agencies | Could Have | Secondary segment |
| **BR-008** | API cho integration | Could Have | Developer segment |

### 5.2 Compliance Requirements

| ID | Requirement | Standard | Priority |
|----|-------------|----------|----------|
| **CR-001** | Data storage trong Vietnam hoặc compliant region | PDPD 2023 | Must Have |
| **CR-002** | User consent cho data processing | PDPD 2023 | Must Have |
| **CR-003** | Secure data transmission (TLS 1.3) | Industry standard | Must Have |
| **CR-004** | Report format theo OWASP Top 10 | OWASP | Must Have |
| **CR-005** | Audit logging cho tất cả scans | Security best practice | Should Have |

### 5.3 Operational Requirements

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| **OR-001** | System uptime | >99.5% | Must Have |
| **OR-002** | Scan queue processing time | <5 phút wait | Must Have |
| **OR-003** | Support response time | <4 giờ (business hours) | Should Have |
| **OR-004** | Data backup frequency | Daily | Must Have |
| **OR-005** | Disaster recovery RTO | <4 giờ | Should Have |

---

## 6. Revenue Model

### 6.1 Pricing Strategy

#### Tier Structure

| Tier | Giá/tháng | Target User | Key Features |
|------|-----------|-------------|--------------|
| **Free** | 0đ | Trial users | 1 scan/tháng, basic report |
| **Starter** | 199k VND (~$8) | Shop nhỏ | 5 scans/tháng, PDF report, email alerts |
| **Pro** | 499k VND (~$20) | Startup/Agency | Unlimited scans, API, scheduled scans |
| **Agency** | 1.2tr VND (~$50) | Dev shops | Multi-client, white-label, team seats |

#### Add-ons
| Add-on | Price | Description |
|--------|-------|-------------|
| One-time scan | 99k VND | Single scan không cần subscription |
| Remediation support | 2-5tr VND | Hỗ trợ fix lỗ hổng |
| Compliance report | 500k VND | OWASP/PCI-DSS formatted |

### 6.2 Revenue Projections

```
Year 1 Revenue Breakdown:
├── Month 1-3:  10 paid × 300k avg  =    3tr/tháng
├── Month 4-6:  50 paid × 320k avg  =   16tr/tháng
├── Month 7-9: 100 paid × 340k avg  =   34tr/tháng
└── Month 10-12: 200 paid × 350k avg = 70tr/tháng

Year 1 Total: ~400tr VND (~$16,000)
Year 2 Target: ~1.5tỷ VND (~$60,000)
Year 3 Target: ~4tỷ VND (~$160,000)
```

### 6.3 Cost Structure

| Category | Monthly Cost (Year 1) | Notes |
|----------|----------------------|-------|
| **Infrastructure** | 3-5tr VND | VPS, storage, CDN |
| **Third-party APIs** | 500k-1tr VND | SSL Labs, etc. |
| **Marketing** | 5-10tr VND | Content, ads |
| **Support tools** | 500k VND | Helpdesk, monitoring |
| **Total** | ~10-15tr VND | Break-even: ~40 paid users |

---

## 7. Go-to-Market Strategy

### 7.1 Launch Phases

#### Phase 1: Validation (Tuần 1-2)
- Landing page với waitlist
- User interviews (20 SME owners)
- **Goal**: 100 waitlist signups

#### Phase 2: MVP Beta (Tuần 3-8)
- Core scanning features
- Beta testing với 50 users
- **Goal**: 80% satisfaction rate

#### Phase 3: Soft Launch (Tháng 3)
- Public launch với pricing
- Content marketing bắt đầu
- **Goal**: 50 paid users

#### Phase 4: Growth (Tháng 4+)
- Partnership với hosting providers
- Referral program
- **Goal**: 200 paid users end of Year 1

### 7.2 Marketing Channels

| Channel | Strategy | Budget/tháng |
|---------|----------|--------------|
| **Content Marketing** | Blog SEO, YouTube tutorials | 3tr VND |
| **Community** | Facebook groups, Reddit VN | 1tr VND |
| **Partnerships** | Hosting providers, web agencies | Revenue share |
| **Referral** | 30% commission tháng đầu | Variable |
| **Paid Ads** | Google Ads, Facebook Ads | 3-5tr VND |

### 7.3 Content Strategy

**Key Content Pillars:**
1. "Bảo mật website 101" - Educational content cho non-tech users
2. "Hacker tấn công như thế nào" - Fear-based awareness
3. Case studies từ beta users
4. Technical tutorials cho developers

**Content Calendar (Monthly):**
- 4 blog posts (SEO-focused)
- 2 YouTube videos
- 8 social media posts
- 1 email newsletter

---

## 8. Risk Analysis

### 8.1 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low market adoption | Medium | High | Extensive validation, pivot ready |
| Price war với competitors | Low | Medium | Focus on localization advantage |
| Economic downturn | Medium | Medium | Flexible pricing, focus on ROI |
| Regulatory changes | Low | High | Legal monitoring, compliance-first |

### 8.2 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| High false positive rate | Medium | High | ML refinement, manual review option |
| Scan engine abuse | Medium | Medium | Domain verification, rate limiting |
| Data breach | Low | Critical | Security-first architecture, audits |
| Infrastructure failure | Low | High | Multi-region, disaster recovery |

### 8.3 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Support overload | Medium | Medium | Self-service docs, chatbot |
| Key person dependency | Medium | High | Documentation, cross-training |
| Scaling challenges | Medium | Medium | Cloud-native architecture |

---

## 9. Success Criteria & Exit Strategy

### 9.1 Go/No-Go Criteria

**After MVP (Month 2):**
- [ ] 50+ beta users acquired
- [ ] Scan completion rate >90%
- [ ] User satisfaction >70%

**After Soft Launch (Month 4):**
- [ ] 30+ paid users
- [ ] Churn rate <10%
- [ ] Positive unit economics

**After Year 1:**
- [ ] 150+ paid users
- [ ] MRR >50tr VND
- [ ] Break-even achieved

### 9.2 Pivot Options

Nếu không đạt targets:
1. **Pivot to B2B only** - Focus hoàn toàn vào agencies/enterprises
2. **Pivot to consulting** - Sử dụng tool như lead gen cho consulting services
3. **Pivot geography** - Expand sang SEA markets (Thailand, Indonesia)
4. **Acquisition target** - Position for acqui-hire by larger security company

### 9.3 Long-term Exit Options

| Option | Timeline | Valuation Target |
|--------|----------|------------------|
| Continue bootstrapped | Ongoing | N/A |
| Strategic acquisition | Year 3-5 | 3-5x ARR |
| PE/VC investment | Year 2-3 | Based on growth |

---

## 10. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **SME** | Small and Medium Enterprise |
| **MRR** | Monthly Recurring Revenue |
| **OWASP** | Open Web Application Security Project |
| **CVE** | Common Vulnerabilities and Exposures |
| **CWE** | Common Weakness Enumeration |
| **PDPD** | Personal Data Protection Decree |

### Appendix B: References

1. OWASP Top 10:2025 - https://owasp.org/Top10/2025/
2. Vietnam Apps Market Report 2024 - Ken Research
3. Vietnam Cybersecurity Report 2023 - NCSC
4. Personal Data Protection Decree 2023 - Vietnam Government

### Appendix C: Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 15/12/2025 | SecureScan Team | Initial draft |

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Business Sponsor | | | |
