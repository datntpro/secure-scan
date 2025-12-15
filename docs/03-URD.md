# User Requirements Document (URD)
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

Tài liệu này mô tả các yêu cầu từ góc nhìn người dùng, bao gồm user personas, user stories, use cases, và user journey maps.

### 1.2 Document Scope

- User personas và characteristics
- User stories cho từng persona
- Detailed use cases
- User journey maps
- Acceptance criteria

---

## 2. User Personas

### 2.1 Persona 1: Minh - Chủ shop online

```
┌─────────────────────────────────────────────────────────────────┐
│  👤 PERSONA: MINH - CHỦ SHOP ONLINE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Demographics:                                                   │
│  • Tuổi: 28                                                     │
│  • Nghề nghiệp: Chủ shop quần áo online                        │
│  • Location: TP.HCM                                             │
│  • Tech level: Thấp (biết dùng Facebook, Shopee)               │
│                                                                  │
│  Goals:                                                          │
│  • Bảo vệ website khỏi bị hack                                  │
│  • Bảo vệ thông tin khách hàng                                  │
│  • Không muốn bị phạt vì vi phạm bảo mật                       │
│                                                                  │
│  Frustrations:                                                   │
│  • Không hiểu technical terms                                   │
│  • Không biết bắt đầu từ đâu                                   │
│  • Tools nước ngoài quá đắt và phức tạp                        │
│                                                                  │
│  Quote:                                                          │
│  "Tôi chỉ muốn biết website của tôi có an toàn không,          │
│   không cần hiểu chi tiết kỹ thuật"                             │
│                                                                  │
│  Budget: 200k-500k VND/tháng                                    │
│  Preferred channels: Zalo, Facebook                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Persona 2: Hùng - IT Manager tại SME

```
┌─────────────────────────────────────────────────────────────────┐
│  👤 PERSONA: HÙNG - IT MANAGER                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Demographics:                                                   │
│  • Tuổi: 35                                                     │
│  • Nghề nghiệp: IT Manager tại công ty logistics 150 người     │
│  • Location: Hà Nội                                             │
│  • Tech level: Trung bình-Cao                                   │
│                                                                  │
│  Goals:                                                          │
│  • Báo cáo tình trạng bảo mật cho leadership                   │
│  • Đảm bảo compliance với quy định mới                         │
│  • Chủ động phát hiện và fix lỗ hổng                           │
│                                                                  │
│  Frustrations:                                                   │
│  • Budget hạn chế, không thể mua enterprise tools              │
│  • Không có dedicated security team                             │
│  • Cần report dễ hiểu để trình sếp                             │
│                                                                  │
│  Quote:                                                          │
│  "Tôi cần một tool có thể tạo report chuyên nghiệp             │
│   để trình cho ban giám đốc mỗi tháng"                         │
│                                                                  │
│  Budget: 500k-2tr VND/tháng                                     │
│  Preferred channels: Email, Slack                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Persona 3: Linh - Freelance Developer

```
┌─────────────────────────────────────────────────────────────────┐
│  👤 PERSONA: LINH - FREELANCE DEVELOPER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Demographics:                                                   │
│  • Tuổi: 26                                                     │
│  • Nghề nghiệp: Freelance web developer                        │
│  • Location: Đà Nẵng                                            │
│  • Tech level: Cao                                              │
│                                                                  │
│  Goals:                                                          │
│  • Scan website cho clients trước khi bàn giao                 │
│  • Upsell security service cho clients                         │
│  • Professional reports để build trust                          │
│                                                                  │
│  Frustrations:                                                   │
│  • Tốn thời gian manual testing                                │
│  • Clients không hiểu technical reports                        │
│  • Cần white-label để branding                                 │
│                                                                  │
│  Quote:                                                          │
│  "Tôi muốn include security scan như một service               │
│   cho tất cả dự án của mình"                                   │
│                                                                  │
│  Budget: 1-3tr VND/tháng                                        │
│  Preferred channels: Telegram, Discord                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Persona 4: Trang - Agency Owner

```
┌─────────────────────────────────────────────────────────────────┐
│  👤 PERSONA: TRANG - AGENCY OWNER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Demographics:                                                   │
│  • Tuổi: 32                                                     │
│  • Nghề nghiệp: Owner của web agency 10 người                  │
│  • Location: TP.HCM                                             │
│  • Tech level: Trung bình (business-focused)                   │
│                                                                  │
│  Goals:                                                          │
│  • Manage security cho 20+ client websites                     │
│  • Team có thể sử dụng chung                                   │
│  • Automate monthly security checks                            │
│                                                                  │
│  Frustrations:                                                   │
│  • Quản lý nhiều clients tốn thời gian                         │
│  • Cần phân quyền cho team members                             │
│  • Reports cần customizable cho từng client                    │
│                                                                  │
│  Quote:                                                          │
│  "Tôi cần một platform mà cả team có thể sử dụng              │
│   và quản lý tất cả clients ở một nơi"                        │
│                                                                  │
│  Budget: 3-5tr VND/tháng                                        │
│  Preferred channels: Email, Meetings                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. User Stories

### 3.1 User Stories - Minh (Shop Owner)

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| **US-M-001** | Là Minh, tôi muốn đăng ký tài khoản bằng email để bắt đầu sử dụng dịch vụ | Must | - Đăng ký thành công trong <2 phút<br>- Nhận email xác nhận<br>- Có hướng dẫn bước tiếp theo |
| **US-M-002** | Là Minh, tôi muốn thêm website của mình vào hệ thống một cách đơn giản | Must | - Chỉ cần nhập URL<br>- Hướng dẫn verify rõ ràng tiếng Việt<br>- Có video hướng dẫn |
| **US-M-003** | Là Minh, tôi muốn scan website bằng 1 click mà không cần cấu hình phức tạp | Must | - Nhấn nút "Scan ngay"<br>- Không yêu cầu cấu hình<br>- Hiển thị progress trực quan |
| **US-M-004** | Là Minh, tôi muốn xem kết quả scan bằng tiếng Việt dễ hiểu | Must | - 100% tiếng Việt<br>- Không dùng thuật ngữ kỹ thuật<br>- Có giải thích đơn giản |
| **US-M-005** | Là Minh, tôi muốn biết website của tôi "an toàn" hay "không an toàn" rõ ràng | Must | - Điểm đánh giá A/B/C/D/F<br>- Màu sắc trực quan (xanh/đỏ)<br>- Summary ngắn gọn |
| **US-M-006** | Là Minh, tôi muốn biết cách fix lỗi mà không cần thuê developer | Should | - Hướng dẫn từng bước<br>- Screenshot/video nếu cần<br>- Link tới hướng dẫn chi tiết |
| **US-M-007** | Là Minh, tôi muốn được thông báo qua Zalo khi có vấn đề bảo mật mới | Could | - Tích hợp Zalo OA<br>- Thông báo khi có lỗi critical/high |
| **US-M-008** | Là Minh, tôi muốn liên hệ support trực tiếp khi gặp vấn đề | Should | - Chat support trong app<br>- Zalo support channel<br>- Response trong 4 giờ |

### 3.2 User Stories - Hùng (IT Manager)

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| **US-H-001** | Là Hùng, tôi muốn scan tất cả websites của công ty từ một dashboard | Must | - Dashboard tổng quan<br>- List tất cả domains<br>- Status từng domain |
| **US-H-002** | Là Hùng, tôi muốn schedule scan tự động hàng tuần/tháng | Must | - Chọn frequency<br>- Chọn thời gian scan<br>- Email notification khi xong |
| **US-H-003** | Là Hùng, tôi muốn export report PDF chuyên nghiệp để trình sếp | Must | - PDF format chuẩn<br>- Executive summary<br>- Charts và graphs |
| **US-H-004** | Là Hùng, tôi muốn so sánh kết quả scan giữa các tháng để theo dõi tiến độ | Should | - Comparison view<br>- Trend charts<br>- Fixed vs New findings |
| **US-H-005** | Là Hùng, tôi muốn report theo chuẩn OWASP Top 10 để chứng minh compliance | Must | - OWASP Top 10 mapping<br>- Compliance score<br>- Gap analysis |
| **US-H-006** | Là Hùng, tôi muốn xem chi tiết technical findings để assign cho dev team | Should | - Chi tiết từng vulnerability<br>- Evidence/proof<br>- Remediation steps |
| **US-H-007** | Là Hùng, tôi muốn track status của từng vulnerability (fixed/in-progress) | Could | - Status tracking<br>- Assignee field<br>- Notes/comments |
| **US-H-008** | Là Hùng, tôi muốn integrate với Slack để nhận notifications | Could | - Slack webhook<br>- Configurable alerts |

### 3.3 User Stories - Linh (Freelance Developer)

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| **US-L-001** | Là Linh, tôi muốn scan website của client nhanh chóng trước khi bàn giao | Must | - Scan hoàn thành <30 phút<br>- Không giới hạn domains (Pro plan) |
| **US-L-002** | Là Linh, tôi muốn access API để integrate vào CI/CD pipeline | Must | - RESTful API<br>- API documentation<br>- Code examples |
| **US-L-003** | Là Linh, tôi muốn tạo report white-label với logo của mình | Should | - Upload custom logo<br>- Custom company name<br>- Remove SecureScan branding |
| **US-L-004** | Là Linh, tôi muốn config scan depth và specific tests để tiết kiệm thời gian | Should | - Scan profiles<br>- Include/exclude paths<br>- Test selection |
| **US-L-005** | Là Linh, tôi muốn scan với authentication để test protected areas | Should | - Form-based auth<br>- Cookie injection<br>- Header auth |
| **US-L-006** | Là Linh, tôi muốn xem detailed technical report với raw evidence | Should | - Raw HTTP requests/responses<br>- Full technical details<br>- JSON export |
| **US-L-007** | Là Linh, tôi muốn re-scan specific vulnerabilities sau khi fix | Could | - Targeted re-scan<br>- Verify fix status |
| **US-L-008** | Là Linh, tôi muốn được webhook notification khi scan xong | Could | - Webhook configuration<br>- Custom payload |

### 3.4 User Stories - Trang (Agency Owner)

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| **US-T-001** | Là Trang, tôi muốn quản lý tất cả client websites từ một account | Must | - Multi-client support<br>- Client grouping<br>- Client-level settings |
| **US-T-002** | Là Trang, tôi muốn invite team members với different permissions | Must | - Team invites<br>- Role-based access<br>- Per-client permissions |
| **US-T-003** | Là Trang, tôi muốn generate reports cho từng client với branding riêng | Should | - Per-client branding<br>- Custom templates<br>- Bulk report generation |
| **US-T-004** | Là Trang, tôi muốn xem overview dashboard của tất cả clients | Must | - Multi-client dashboard<br>- Summary statistics<br>- Alert aggregation |
| **US-T-005** | Là Trang, tôi muốn schedule scans cho tất cả clients cùng lúc | Should | - Bulk scheduling<br>- Staggered execution<br>- Consolidated notifications |
| **US-T-006** | Là Trang, tôi muốn billing report theo từng client để charge back | Could | - Per-client usage tracking<br>- Export billing data |
| **US-T-007** | Là Trang, tôi muốn API access để integrate với project management tool | Could | - Full API access<br>- Webhook integrations |
| **US-T-008** | Là Trang, tôi muốn có dedicated support channel cho agency | Could | - Priority support<br>- Dedicated account manager |

---

## 4. Use Cases

### 4.1 Use Case: First Time Scan

```
┌─────────────────────────────────────────────────────────────────┐
│  USE CASE: UC-001 First Time Scan                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Actor: New User (any persona)                                  │
│  Precondition: User chưa có account                            │
│  Goal: Complete first successful scan                           │
│                                                                  │
│  Main Flow:                                                      │
│  1. User truy cập website SecureScan.vn                        │
│  2. User click "Đăng ký miễn phí"                              │
│  3. User nhập email, password, tên                             │
│  4. System gửi email verification                               │
│  5. User verify email                                           │
│  6. System hiển thị dashboard với "Add website" prompt         │
│  7. User nhập URL website                                       │
│  8. System hiển thị verification options                        │
│  9. User chọn DNS verification                                  │
│  10. User add TXT record vào DNS                               │
│  11. User click "Verify"                                        │
│  12. System verifies và hiển thị success                       │
│  13. User click "Scan ngay"                                    │
│  14. System queues scan và hiển thị progress                   │
│  15. System completes scan và hiển thị results                 │
│                                                                  │
│  Alternative Flow:                                               │
│  9a. User chọn File verification                               │
│      9a1. User downloads verification file                     │
│      9a2. User uploads file to website root                    │
│      9a3. Continue from step 11                                │
│                                                                  │
│  Exception Flow:                                                 │
│  10a. DNS not propagated yet                                   │
│       10a1. System shows "Đang chờ DNS cập nhật"              │
│       10a2. System provides retry option                       │
│  14a. Scan fails                                               │
│       14a1. System shows error message                         │
│       14a2. System provides retry option                       │
│                                                                  │
│  Postcondition: User có scan results đầu tiên                  │
│  Success Metric: <15 phút từ signup đến first result           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Use Case: Scheduled Recurring Scan

```
┌─────────────────────────────────────────────────────────────────┐
│  USE CASE: UC-002 Scheduled Recurring Scan                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Actor: Pro/Agency User                                         │
│  Precondition: User có verified domain                         │
│  Goal: Setup automatic weekly/monthly scans                     │
│                                                                  │
│  Main Flow:                                                      │
│  1. User navigates to domain settings                          │
│  2. User clicks "Schedule Scan"                                │
│  3. System displays scheduling options                          │
│  4. User selects frequency (weekly/monthly)                    │
│  5. User selects preferred day/time                            │
│  6. User selects notification preferences                      │
│  7. User clicks "Save Schedule"                                │
│  8. System confirms schedule created                           │
│  9. System runs scan at scheduled time                         │
│  10. System sends notification when complete                   │
│                                                                  │
│  Alternative Flow:                                               │
│  6a. User enables comparison with previous scan                │
│      6a1. System will include comparison in report             │
│                                                                  │
│  Exception Flow:                                                 │
│  9a. Scheduled scan fails                                      │
│      9a1. System retries once after 1 hour                    │
│      9a2. If still fails, send failure notification           │
│                                                                  │
│  Postcondition: Schedule saved, scans run automatically        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Use Case: View and Export Report

```
┌─────────────────────────────────────────────────────────────────┐
│  USE CASE: UC-003 View and Export Report                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Actor: Any authenticated user                                  │
│  Precondition: Scan completed successfully                     │
│  Goal: View results and export PDF report                      │
│                                                                  │
│  Main Flow:                                                      │
│  1. User navigates to scan history                             │
│  2. User clicks on completed scan                              │
│  3. System displays scan results dashboard                      │
│     - Executive summary                                         │
│     - Risk score                                                │
│     - Coverage metrics                                          │
│     - Findings by severity                                      │
│  4. User clicks on specific finding                            │
│  5. System displays finding details                             │
│     - Description (Vietnamese)                                  │
│     - Evidence                                                  │
│     - Remediation steps                                         │
│  6. User clicks "Download PDF"                                 │
│  7. System generates PDF report                                 │
│  8. Browser downloads PDF file                                  │
│                                                                  │
│  Alternative Flow:                                               │
│  6a. User clicks "Email Report"                                │
│      6a1. System prompts for email addresses                   │
│      6a2. User enters emails                                   │
│      6a3. System sends report via email                        │
│                                                                  │
│  Postcondition: User has viewed/downloaded report              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Use Case: API Integration

```
┌─────────────────────────────────────────────────────────────────┐
│  USE CASE: UC-004 API Integration                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Actor: Developer (Pro/Agency User)                            │
│  Precondition: User has Pro/Agency subscription                │
│  Goal: Integrate scanning into CI/CD pipeline                  │
│                                                                  │
│  Main Flow:                                                      │
│  1. User navigates to Settings > API                           │
│  2. User clicks "Generate API Key"                             │
│  3. System generates API key and secret                        │
│  4. User copies credentials                                    │
│  5. User implements API calls in CI/CD:                        │
│     a. POST /api/v1/scans to create scan                      │
│     b. GET /api/v1/scans/{id}/progress to check status        │
│     c. GET /api/v1/scans/{id}/findings to get results         │
│  6. CI/CD pipeline runs scan on each deployment               │
│  7. Pipeline fails if critical vulnerabilities found          │
│                                                                  │
│  Alternative Flow:                                               │
│  5a. User configures webhook instead of polling                │
│      5a1. User sets webhook URL in settings                   │
│      5a2. System POSTs results to webhook when complete       │
│                                                                  │
│  Exception Flow:                                                 │
│  5a. Rate limit exceeded                                       │
│      5a1. API returns 429 Too Many Requests                   │
│      5a2. User implements backoff/retry                       │
│                                                                  │
│  Postcondition: CI/CD integration working                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. User Journey Maps

### 5.1 Journey: Minh - First Time User

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  USER JOURNEY: MINH - FIRST TIME SCAN                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  STAGE      │ AWARENESS     │ CONSIDERATION │ SIGNUP        │ FIRST SCAN    │ RESULTS   │
│  ───────────┼───────────────┼───────────────┼───────────────┼───────────────┼───────────│
│             │               │               │               │               │           │
│  ACTIONS    │ • Sees FB ad  │ • Visits site │ • Clicks      │ • Adds domain │ • Views   │
│             │ • Googles     │ • Reads       │   signup      │ • Verifies    │   results │
│             │   "bảo mật    │   pricing     │ • Enters info │   ownership   │ • Reads   │
│             │   website"    │ • Checks      │ • Verifies    │ • Clicks scan │   summary │
│             │               │   features    │   email       │               │           │
│             │               │               │               │               │           │
│  ───────────┼───────────────┼───────────────┼───────────────┼───────────────┼───────────│
│             │               │               │               │               │           │
│  THINKING   │ "Website mình│ "Giá có vẻ    │ "Đăng ký      │ "Verify này   │ "À, vậy   │
│             │ có bị hack    │ ok, thử free  │ nhanh thật"   │ hơi khó,      │ là website│
│             │ không nhỉ?"   │ xem sao"      │               │ nhưng có      │ mình có   │
│             │               │               │               │ hướng dẫn"    │ 3 lỗi"    │
│             │               │               │               │               │           │
│  ───────────┼───────────────┼───────────────┼───────────────┼───────────────┼───────────│
│             │               │               │               │               │           │
│  FEELING    │ 😟 Lo lắng    │ 🤔 Tò mò     │ 😊 Dễ dàng   │ 😰 Hơi khó   │ 😮 Ngạc   │
│             │               │               │               │ → 😌 OK      │ nhiên     │
│             │               │               │               │               │           │
│  ───────────┼───────────────┼───────────────┼───────────────┼───────────────┼───────────│
│             │               │               │               │               │           │
│  PAIN       │ • Không biết  │ • Sợ phức    │ • Cần email   │ • DNS verify  │ • Không   │
│  POINTS     │   bắt đầu     │   tạp        │   verify      │   khó hiểu    │   hiểu    │
│             │   từ đâu      │ • Sợ đắt     │               │               │   technical│
│             │               │               │               │               │   terms   │
│             │               │               │               │               │           │
│  ───────────┼───────────────┼───────────────┼───────────────┼───────────────┼───────────│
│             │               │               │               │               │           │
│  OPPORT-    │ • SEO content │ • Clear      │ • Social      │ • Video       │ • Simple  │
│  UNITIES    │ • Social ads  │   pricing    │   login       │   tutorial    │   language│
│             │ • Testimonials│ • Free trial │ • Quick form  │ • File verify │ • Action  │
│             │               │               │               │   option      │   items   │
│             │               │               │               │               │           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Journey: Hùng - Monthly Security Review

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  USER JOURNEY: HÙNG - MONTHLY SECURITY REVIEW                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  STAGE      │ PREPARATION   │ SCANNING      │ ANALYSIS      │ REPORTING     │ ACTION    │
│  ───────────┼───────────────┼───────────────┼───────────────┼───────────────┼───────────│
│             │               │               │               │               │           │
│  ACTIONS    │ • Login to    │ • Review auto │ • Compare     │ • Generate    │ • Assign  │
│             │   dashboard   │   scan results│   with last   │   PDF report  │   fixes   │
│             │ • Check all   │ • Check new   │   month       │ • Present to  │ • Schedule│
│             │   domains     │   findings    │ • Identify    │   leadership  │   follow- │
│             │               │               │   priorities  │               │   up scan │
│             │               │               │               │               │           │
│  ───────────┼───────────────┼───────────────┼───────────────┼───────────────┼───────────│
│             │               │               │               │               │           │
│  THINKING   │ "Xem tháng   │ "À có 2 lỗi  │ "So với tháng│ "Report này   │ "Cần dev  │
│             │ này có gì     │ mới phát hiện"│ trước đã fix │ đủ chuyên     │ fix trong │
│             │ mới không"    │               │ được 3 lỗi"  │ nghiệp chưa"  │ tuần này" │
│             │               │               │               │               │           │
│  ───────────┼───────────────┼───────────────┼───────────────┼───────────────┼───────────│
│             │               │               │               │               │           │
│  FEELING    │ 😐 Routine   │ 😮 Surprised │ 😊 Progress  │ 💪 Confident │ ✅ Done   │
│             │               │ (new findings)│               │               │           │
│             │               │               │               │               │           │
│  ───────────┼───────────────┼───────────────┼───────────────┼───────────────┼───────────│
│             │               │               │               │               │           │
│  PAIN       │ • Multiple    │ • Need to     │ • Manual      │ • Report      │ • Track   │
│  POINTS     │   domains     │   triage      │   comparison  │   formatting  │   fix     │
│             │   to check    │   findings    │               │               │   status  │
│             │               │               │               │               │           │
│  ───────────┼───────────────┼───────────────┼───────────────┼───────────────┼───────────│
│             │               │               │               │               │           │
│  OPPORT-    │ • Multi-      │ • Auto        │ • Built-in    │ • Executive   │ • Issue   │
│  UNITIES    │   domain      │   triage by   │   comparison  │   summary     │   tracking│
│             │   dashboard   │   severity    │   feature     │   template    │   feature │
│             │               │               │               │               │           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Feature Prioritization Matrix

### 6.1 MoSCoW Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE PRIORITIZATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MUST HAVE (MVP)                                                │
│  ├── User registration & login                                  │
│  ├── Domain management & verification                           │
│  ├── Basic vulnerability scanning                               │
│  ├── Vietnamese reports                                         │
│  ├── PDF export                                                 │
│  ├── Email notifications                                        │
│  └── Basic dashboard                                            │
│                                                                  │
│  SHOULD HAVE (Phase 2)                                          │
│  ├── Scheduled scans                                            │
│  ├── Scan comparison                                            │
│  ├── API access                                                 │
│  ├── Advanced scan config                                       │
│  ├── Multiple notification channels                             │
│  └── User profile customization                                 │
│                                                                  │
│  COULD HAVE (Phase 3)                                           │
│  ├── White-label reports                                        │
│  ├── Team management                                            │
│  ├── Zalo/Telegram integration                                  │
│  ├── Webhook support                                            │
│  ├── Issue tracking                                             │
│  └── Authenticated scanning                                     │
│                                                                  │
│  WON'T HAVE (Out of scope)                                      │
│  ├── Mobile native app                                          │
│  ├── SAST (source code scanning)                               │
│  ├── Penetration testing service                               │
│  └── Custom vulnerability research                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 User Story Mapping

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              USER STORY MAP                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  USER ACTIVITIES (Left to Right)                                                         │
│                                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  SIGNUP  │  │  SETUP   │  │  SCAN    │  │  VIEW    │  │  EXPORT  │  │ MONITOR  │   │
│  │          │  │ DOMAINS  │  │ WEBSITE  │  │ RESULTS  │  │ REPORTS  │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       │             │             │             │             │             │           │
│  ─────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────  │
│  MVP  │ Register    │ Add domain  │ Quick scan  │ Summary     │ PDF export  │ Email     │
│       │ Login       │ DNS verify  │ View        │ Finding     │             │ alerts    │
│       │ Verify      │ File verify │ progress    │ list        │             │           │
│       │ email       │             │             │ Details     │             │           │
│  ─────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────  │
│  V1.1 │ Social      │ Bulk add    │ Config      │ Filter/     │ Email       │ Scheduled │
│       │ login       │             │ options     │ sort        │ report      │ scans     │
│       │             │             │ Re-scan     │ Compare     │             │ Dashboard │
│  ─────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────  │
│  V1.2 │ SSO         │ Auto-       │ Auth        │ Issue       │ White-      │ Webhook   │
│       │             │ renew       │ scanning    │ tracking    │ label       │ API       │
│       │             │             │             │ Export      │ Custom      │ Slack     │
│       │             │             │             │ JSON        │ template    │           │
│  ─────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────  │
│  V2.0 │ Teams       │ Multi-      │ CI/CD       │ Trends      │ Bulk        │ Zalo      │
│       │             │ tenant      │ integr.     │ analysis    │ export      │ Telegram  │
│       │             │             │             │             │             │           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Acceptance Criteria Templates

### 7.1 Gherkin Format Examples

#### Feature: User Registration
```gherkin
Feature: User Registration
  As a new user
  I want to create an account
  So that I can scan my website

  Scenario: Successful registration
    Given I am on the registration page
    When I enter valid email "test@example.com"
    And I enter password "SecurePass123"
    And I enter name "Nguyễn Văn A"
    And I click "Đăng ký"
    Then I should see "Vui lòng xác nhận email của bạn"
    And I should receive verification email within 5 minutes

  Scenario: Registration with existing email
    Given email "existing@example.com" is already registered
    When I try to register with "existing@example.com"
    Then I should see error "Email này đã được sử dụng"
    And I should see link "Đăng nhập" 

  Scenario: Registration with weak password
    Given I am on the registration page
    When I enter password "123456"
    Then I should see error "Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 số"
```

#### Feature: Website Scanning
```gherkin
Feature: Website Scanning
  As a user with verified domain
  I want to scan my website
  So that I can find security vulnerabilities

  Scenario: Start new scan
    Given I have verified domain "myshop.vn"
    And I have remaining scan quota
    When I click "Scan ngay" for "myshop.vn"
    Then scan should be queued
    And I should see progress indicator
    And progress should update every 5 seconds

  Scenario: Scan completion
    Given scan for "myshop.vn" is running
    When scan completes successfully
    Then I should see results summary
    And I should receive email notification
    And scan history should be updated

  Scenario: No remaining quota
    Given I have 0 scans remaining this month
    When I try to start new scan
    Then I should see "Bạn đã hết lượt scan tháng này"
    And I should see upgrade options
```

---

## 8. Non-Functional User Requirements

### 8.1 Usability Requirements

| ID | Requirement | Measure | Target |
|----|-------------|---------|--------|
| **UUR-001** | First scan completion time | Time from signup to first results | <15 minutes |
| **UUR-002** | Learning curve | Tasks completed without help | >80% |
| **UUR-003** | Error recovery | Users can recover from errors | >95% |
| **UUR-004** | Mobile usability | Core tasks on mobile | 100% |
| **UUR-005** | Language support | UI in Vietnamese | 100% |

### 8.2 Accessibility Requirements

| ID | Requirement | Standard |
|----|-------------|----------|
| **UAR-001** | Keyboard navigation | All actions accessible via keyboard |
| **UAR-002** | Screen reader support | ARIA labels on interactive elements |
| **UAR-003** | Color contrast | WCAG 2.1 AA (4.5:1 ratio) |
| **UAR-004** | Focus indicators | Visible focus on all interactive elements |
| **UAR-005** | Form labels | All inputs have associated labels |

### 8.3 Performance Expectations

| Action | Expected Time | User Perception |
|--------|---------------|-----------------|
| Page load | <3 seconds | "Fast" |
| Scan start | <2 minutes | "Quick queue" |
| Progress update | Real-time | "Responsive" |
| Report generation | <30 seconds | "Instant" |
| PDF download | <10 seconds | "Quick" |

---

## 9. Appendices

### Appendix A: User Interview Questions

**For Shop Owners:**
1. Bạn có lo ngại về bảo mật website không? Tại sao?
2. Bạn đã từng bị hack hoặc biết ai bị hack chưa?
3. Bạn sẵn sàng trả bao nhiêu tiền/tháng cho một tool bảo vệ website?
4. Bạn muốn được thông báo qua kênh nào?
5. Điều gì quan trọng nhất trong một tool bảo mật?

**For IT Managers:**
1. Quy trình security review hiện tại của bạn như thế nào?
2. Bạn đang dùng tools nào để kiểm tra bảo mật?
3. Khó khăn lớn nhất khi báo cáo bảo mật cho leadership?
4. Bạn cần những gì trong một security report?
5. Budget cho security tools là bao nhiêu?

### Appendix B: Competitor User Reviews Analysis

| Competitor | Positive Feedback | Negative Feedback |
|------------|-------------------|-------------------|
| Nessus | Comprehensive, Accurate | Complex UI, Expensive |
| Acunetix | Fast scanning, Good reports | Steep learning curve |
| Intruder | Easy to use | Limited customization |
| Free tools | Free | No support, Technical |

### Appendix C: Survey Results Summary

*To be completed after user research phase*

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| UX Designer | | | |
| Business Analyst | | | |
