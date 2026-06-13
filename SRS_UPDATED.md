# SRS_UPDATED.md — Đặc tả Yêu cầu Hệ thống LMS (Cập nhật từ Mã nguồn)
> **Phiên bản:** 2.0 — Reverse-engineered từ source code thực tế  
> **Ngày cập nhật:** 2026-06-12  
> **Phạm vi:** Backend ASP.NET Core 8 + Frontend React 18 (TypeScript)

---

## MỤC LỤC

1. [Tổng quan Kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Mô hình Dữ liệu (Domain Entities)](#2-mô-hình-dữ-liệu-domain-entities)
3. [Phân quyền RBAC — AuthPolicies](#3-phân-quyền-rbac--authpolicies)
4. [Phân hệ Xác thực (Auth)](#4-phân-hệ-xác-thực-auth)
5. [Phân hệ Hồ sơ & Bảo mật Tài khoản (Profile)](#5-phân-hệ-hồ-sơ--bảo-mật-tài-khoản-profile)
6. [Phân hệ Thi cử & Anti-Cheat (Exam)](#6-phân-hệ-thi-cử--anti-cheat-exam)
7. [Phân hệ Bài tập & File Upload (Assignment)](#7-phân-hệ-bài-tập--file-upload-assignment)
8. [Phân hệ Video Bài giảng (Video)](#8-phân-hệ-video-bài-giảng-video)
9. [Phân hệ Thông báo (Notification)](#9-phân-hệ-thông-báo-notification)
10. [Nhật ký Kiểm toán Bất biến (Audit Log)](#10-nhật-ký-kiểm-toán-bất-biến-audit-log)
11. [Middleware Pipeline & Bảo mật Hạ tầng](#11-middleware-pipeline--bảo-mật-hạ-tầng)
12. [Frontend — Anti-Cheat Hooks](#12-frontend--anti-cheat-hooks)
13. [Business Rules Tổng hợp](#13-business-rules-tổng-hợp)
14. [API Endpoints Tổng hợp](#14-api-endpoints-tổng-hợp)

---

## 1. Tổng quan Kiến trúc

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| **Backend** | ASP.NET Core 8, C# | Layered: API → Application (CQRS/MediatR) → Domain → Infrastructure |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS | Tách Hook (logic) / Component (UI) |
| **Database** | SQL Server 2022, EF Core 8 | Immutable Audit Log via DB Trigger |
| **Cache / Session** | Redis 7 | JTI Blacklist, User-Revoke list |
| **Object Storage** | MinIO / Azure Blob Storage | File được mã hoá AES-256-CBC, StorageKey là UUID |
| **Virus Scanner** | ClamAV daemon (TCP INSTREAM) | Quét trước khi lưu Storage |
| **Auth Algorithm** | JWT RS256 (Access), UUID Refresh | Rotation + Reuse Detection |
| **Password Hash** | Argon2id | Constant-time compare |

---

## 2. Mô hình Dữ liệu (Domain Entities)

### 2.1 User

| Trường | Kiểu | Mô tả / Ràng buộc |
|---|---|---|
| `Id` | `Guid` | PK, tự sinh (NewGuid) |
| `Email` | `string` | Normalize: `.Trim().ToLowerInvariant()`, MaxLength 256, unique |
| `PasswordHash` | `string` | Argon2id hash — KHÔNG bao giờ lưu plaintext |
| `Role` | `UserRole` | Enum: Student(0), Instructor(1), Admin(2). Nguồn chân lý RBAC |
| `FailedLoginCount` | `int` | Số lần đăng nhập sai liên tiếp |
| `LockoutEnd` | `DateTime?` | null = không bị khoá. UTC |
| `RefreshToken` | `string?` | UUID 32-hex. null = chưa đăng nhập |
| `RefreshTokenExpiresAt` | `DateTime?` | TTL 7 ngày |
| `CreatedAt` | `DateTime` | UTC |
| `TwoFactorEnabled` | `bool` | Mặc định false |
| `TwoFactorSecret` | `string?` | TOTP secret (Google Authenticator). null khi chưa bật 2FA |

**Domain Behaviours (Business Logic):**
- `RecordFailedLogin()`: tăng `FailedLoginCount++`; nếu `>= 5` → `LockoutEnd = UtcNow + 15 phút`
- `RecordSuccessfulLogin()`: reset `FailedLoginCount = 0`, `LockoutEnd = null`
- `IsLockedOut()`: `LockoutEnd.HasValue && LockoutEnd > UtcNow`
- `SetRefreshToken(token, expiresAt)`: ghi đè token cũ (rotation)
- `RevokeRefreshToken()`: set cả hai field về null
- `IsRefreshTokenValid(token)`: so sánh token khớp AND chưa hết hạn
- `DisableTwoFactor()`: set `TwoFactorEnabled = false`, `TwoFactorSecret = null`

---

### 2.2 ExamSession

| Trường | Kiểu | Mô tả / Ràng buộc |
|---|---|---|
| `SessionId` | `Guid` | PK |
| `ExamId` | `Guid` | FK → Quiz |
| `UserId` | `Guid` | **Lấy từ JWT Claims** — KHÔNG từ URL/Body |
| `StartAt` | `DateTime` | UTC, do server gán = `DateTime.UtcNow` lúc tạo |
| `DurationSeconds` | `int` | > 0. Lấy từ config bài thi, KHÔNG từ client |
| `ViolationCount` | `int` | Server-managed. Ngưỡng 3 → ForceSubmit |
| `Status` | `ExamSessionStatus` | Active / Submitted / ForceSubmitted / Violated |
| `CreatedAt` | `DateTime` | UTC |

**Domain Behaviours:**
- `IsExpired()`: `UtcNow >= StartAt + DurationSeconds`
- `GetRemainingSeconds()`: tính server-side, không bao giờ âm
- `IsActive()`: `Status == Active AND !IsExpired()`
- `RecordViolation()`: tăng `ViolationCount++`; nếu `>= 3` → `Status = ForceSubmitted`, return `true`
- `MarkViolated()`: `Status = Violated` (khi heartbeat phát hiện hết giờ)
- `Submit()`: `Status = Submitted`

---

### 2.3 Assignment & AssignmentSubmission

**Assignment:**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `AssignmentId` | `Guid` | PK |
| `CourseId` | `Guid` | FK → Course |
| `Title` | `string` | NotEmpty |
| `Description` | `string` | |
| `DueAt` | `DateTime` | Deadline nộp bài (UTC) |
| `CreatedAt` | `DateTime` | UTC |

**AssignmentSubmission:**

| Trường | Kiểu | Mô tả / Ràng buộc |
|---|---|---|
| `SubmissionId` | `Guid` | PK |
| `AssignmentId` | `Guid` | FK → Assignment |
| `StudentId` | `Guid` | **Từ JWT Claims** |
| `OriginalFileName` | `string` | Chỉ hiển thị — KHÔNG làm storage key |
| `StorageKey` | `string` | UUID path: `assignments/{assignmentId}/{UUID}.enc` |
| `MimeType` | `string` | Đã xác minh bằng magic bytes |
| `FileSizeBytes` | `long` | > 0, <= 50 MB |
| `Status` | `SubmissionStatus` | Pending / Graded |
| `SubmittedAt` | `DateTime` | UTC |

---

### 2.4 AuditLog

| Trường | Kiểu | Mô tả / Ràng buộc |
|---|---|---|
| `LogID` | `Guid` | PK, `ValueGeneratedNever` |
| `Timestamp` | `DateTimeOffset` | UTC, column type `timestamptz` |
| `ActorID` | `string?` | MaxLength 128 — nullable (unauthenticated actions) |
| `Action` | `string` | MaxLength 512. Format: `"METHOD /path -> statusCode"` |
| `IP` | `string?` | MaxLength 45 (IPv6). X-Forwarded-For ưu tiên |
| `HMACSignature` | `string` | MaxLength 88. Base64(HMAC-SHA256). Payload: `"logId|timestamp|actorId|action|ip"` |

**Bất biến:** DB Trigger `trg_AuditLogs_BlockUpdate` + `trg_AuditLogs_BlockDelete` chặn hoàn toàn UPDATE/DELETE.

---

### 2.5 Course, Module, Lecture

| Entity | Trường chính | Ghi chú |
|---|---|---|
| `Course` | `CourseId`, `InstructorId`, `Title`, `Description`, `ThumbnailUrl`, `IsPublished` | Mặc định `IsPublished = false` |
| `Module` | `ModuleId`, `CourseId`, `Title`, `Order` | Thuộc về Course |
| `Lecture` | `LectureId`, `ModuleId`, `Title`, `VideoPath`, `Order` | VideoPath là path tương đối trong storage |

---

### 2.6 Quiz & Question & Answer

| Entity | Trường chính | Ràng buộc bảo mật |
|---|---|---|
| `Quiz` | `QuizId`, `CourseId`, `Title`, `TimeLimitMin` | `TimeLimitMin > 0` |
| `Question` | `QuestionId`, `QuizId`, `Content`, `Order` | Xáo trộn server-side trước khi gửi client |
| `Answer` | `AnswerId`, `QuestionId`, `Content`, `IsCorrect`, `Order` | **`IsCorrect` TUYỆT ĐỐI KHÔNG serialize ra client response** |

---

### 2.7 Notification

| Trường | Kiểu | Mô tả |
|---|---|---|
| `NotificationId` | `Guid` | PK |
| `UserId` | `Guid` | Người nhận — từ JWT Claims |
| `Title` | `string` | Tiêu đề |
| `Message` | `string` | Nội dung |
| `IsRead` | `bool` | Mặc định false |
| `CreatedAt` | `DateTime` | UTC |

---

## 3. Phân quyền RBAC — AuthPolicies

| Policy Name | Roles được phép | Áp dụng trên |
|---|---|---|
| `StudentOnly` | Student | ExamController, AssignmentsController |
| `InstructorOnly` | Instructor | (Quản lý nội dung khoá học) |
| `AdminOnly` | Admin | (Quản lý user, audit log viewer) |
| `InstructorOrAdmin` | Instructor, Admin | Chấm bài, quản lý nội dung |
| `AnyAuthenticated` | Student, Instructor, Admin | VideoController |

> **Nguyên tắc IDOR:** Mọi endpoint đều lấy `UserId` từ `JWT Claims (sub)` qua `ClaimsPrincipalExtensions.GetRequiredUserId()`. TUYỆT ĐỐI KHÔNG dùng URL params, query string hay request body.

---

## 4. Phân hệ Xác thực (Auth)

### 4.1 Use Case UC-01: Đăng nhập (Login)

**Endpoint:** `POST /api/auth/login`  
**Request Body:**
```json
{ "email": "string (max 256)", "password": "string (8–128 ký tự)" }
```

**Luồng xử lý chi tiết:**
1. FluentValidation: email không rỗng, đúng format, max 256; password không rỗng, min 8, max 128.
2. Normalize email: `.Trim().ToLowerInvariant()`.
3. Tra cứu User theo email trong DB.
4. **Kiểm tra khoá tài khoản** (`IsLockedOut()`) **TRƯỚC khi verify hash** (tránh lãng phí CPU Argon2id) → nếu đang khoá → `HTTP 423 Locked` với `lockoutEnd`.
5. Verify mật khẩu bằng Argon2id **constant-time compare**. Nếu `user == null` vẫn thực hiện đường code giống nhau (chống timing attack / user enumeration).
6. Nếu sai: `RecordFailedLogin()` → tăng `FailedLoginCount`; nếu đạt 5 → khoá 15 phút → `HTTP 401 Unauthorized`, message chung chung.
7. Nếu đúng: `RecordSuccessfulLogin()` (reset counter).
8. Sinh **Access Token** (JWT RS256, 15 phút; claims: `sub`, `email`, `role`, `jti`, `iat`).
9. Sinh **Refresh Token** (UUID 32-hex, 7 ngày).
10. `SetRefreshToken(token, expiresAt)` → persist vào DB (Rotation).
11. Trả `HTTP 200 OK` với `{accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt, userId, email}`.

**HTTP Responses:**

| Code | Điều kiện | Error Key |
|---|---|---|
| 200 | Thành công | — |
| 400 | Validation fail | validation_error |
| 401 | Sai mật khẩu / email không tồn tại | invalid_credentials |
| 423 | Tài khoản đang bị khoá | account_locked + lockoutEnd |

---

### 4.2 Use Case UC-02: Làm mới Token (Refresh)

**Endpoint:** `POST /api/auth/refresh`  
**Request Body:** `{ "refreshToken": "string" }`

**Luồng xử lý chi tiết:**
1. FluentValidation: `refreshToken` không rỗng.
2. Tra cứu User theo `RefreshToken` trong DB.
3. Nếu không tìm thấy User (`user == null`): token không tồn tại / đã bị rotate → `HTTP 401`.
4. **REUSE DETECTION:** Nếu tìm thấy User nhưng `IsRefreshTokenValid()` trả `false` (token hết hạn hoặc không khớp) → `RevokeRefreshToken()` + `RevokeAllUserTokensAsync()` (Redis) → `HTTP 401`.
5. Nếu hợp lệ → Rotation: sinh cặp token mới (Access + Refresh).
6. `SetRefreshToken(newToken, newExpiry)` → persist DB.
7. Trả `HTTP 200 OK` với token pair mới.

**HTTP Responses:**

| Code | Điều kiện | Error Key |
|---|---|---|
| 200 | Thành công | — |
| 400 | refreshToken rỗng | validation_error |
| 401 | Token không hợp lệ / hết hạn / reuse detected | invalid_token |

---

### 4.3 Use Case UC-03: Đăng xuất (Logout)

**Endpoint:** `POST /api/auth/logout`  
**Auth:** Bearer Token bắt buộc  

**Luồng xử lý chi tiết:**
1. Extract từ JWT Claims: `jti` (JWT ID), `sub` (UserId), `exp` (expiry Unix timestamp).
2. Nếu thiếu `jti` hoặc `sub` → `HTTP 401`.
3. Tính TTL còn lại = `exp - UtcNow`.
4. `BlacklistAccessTokenAsync(jti, ttl)` → ghi key `jti_blacklist:{jti}` vào Redis với TTL.
5. `RevokeRefreshToken()` cho User trong DB.
6. Trả `HTTP 204 No Content`.

---

## 5. Phân hệ Hồ sơ & Bảo mật Tài khoản (Profile)

### 5.1 UC-04: Đổi mật khẩu

**Endpoint:** `PUT /api/profile/security/password`  
**Auth:** Bearer Token  
**Request Body:** `{ "currentPassword": "string", "newPassword": "string" }`

**Luồng:** Xác thực mật khẩu hiện tại (Argon2id) → hash mật khẩu mới → `UpdatePassword()`.

**HTTP Responses:**

| Code | Điều kiện |
|---|---|
| 200 | Thành công |
| 400 | Sai mật khẩu hiện tại |
| 401 | Chưa xác thực |
| 404 | User không tồn tại |

---

### 5.2 UC-05: Quản lý 2FA (TOTP/Google Authenticator)

| Endpoint | Method | Mô tả |
|---|---|---|
| `GET /api/profile/security/2fa` | GET | Lấy trạng thái `twoFactorEnabled` |
| `GET /api/profile/security/2fa/setup` | GET | Sinh secret + QR code URI |
| `POST /api/profile/security/2fa/verify` | POST | Xác thực mã 6 số → bật 2FA |
| `DELETE /api/profile/security/2fa` | DELETE | Tắt 2FA, xoá secret |

**Lưu ý:** Tất cả endpoint đều lấy `UserId` từ JWT Claims. `TwoFactorSecret` được lưu trong DB. Khi tắt 2FA, cả `TwoFactorEnabled = false` và `TwoFactorSecret = null`.

---

## 6. Phân hệ Thi cử & Anti-Cheat (Exam)

> **Chỉ `StudentOnly` Policy** — Instructor/Admin không được phép gọi các endpoint này.

### 6.1 UC-06: Heartbeat đồng bộ phiên thi

**Endpoint:** `POST /api/exam/{id:guid}/heartbeat`  
**Tần suất:** Frontend gọi mỗi **30 giây**.

**Luồng xử lý chi tiết:**
1. Extract `UserId` từ JWT Claims.
2. `GetActiveSessionAsync(examId, userId)` — **ownership check** (chỉ tìm session thuộc về chính user + exam đó).
3. Nếu không tìm thấy → `HTTP 404`.
4. `IsExpired()` tính server-side từ `StartAt + DurationSeconds`:
   - Đã hết giờ → `MarkViolated()` → SaveChanges → ném `ExamTimeExpiredException` → `HTTP 400` với `exam_time_expired`.
   - Chưa hết → `GetRemainingSeconds()` → trả `HTTP 200` với `{remainingSeconds, status}`.

**HTTP Responses:**

| Code | Điều kiện | Error Key |
|---|---|---|
| 200 | Phiên thi còn thời gian | — |
| 400 | Hết giờ — phiên đã bị Violated | exam_time_expired |
| 401 | Chưa xác thực / token hết hạn | invalid_token |
| 404 | Không tìm thấy phiên thi active | session_not_found |

---

### 6.2 UC-07: Báo cáo Vi phạm

**Endpoint:** `POST /api/exam/{id:guid}/violation`  
**Request Body:** `{ "violationType": "TabSwitch|FullscreenExit|CopyAttempt|RightClickAttempt" }`

**Validation (FluentValidation):**
- `violationType`: NotEmpty, MaxLength 64, Must be in allowlist: `{"TabSwitch", "FullscreenExit", "CopyAttempt", "RightClickAttempt"}`.

**Luồng xử lý chi tiết:**
1. Extract `UserId` từ JWT Claims.
2. Ownership Check: `GetActiveSessionAsync(examId, userId)`.
3. Double-check hết giờ server-side → nếu hết giờ → xử lý như Heartbeat.
4. `RecordViolation()` — **server tự tăng counter**, KHÔNG nhận số từ client.
5. Nếu `ViolationCount >= 3` → `Status = ForceSubmitted` → ném `ExamForceSubmittedException` → `HTTP 400` với `exam_force_submitted`.
6. Nếu chưa đủ 3: persist → trả `HTTP 200` với `{violationCount, isForceSubmitted: false, message}`.

**HTTP Responses:**

| Code | Điều kiện | Error Key |
|---|---|---|
| 200 | Vi phạm ghi nhận, chưa force submit | — |
| 400 | Force Submit (>= 3 vi phạm) | exam_force_submitted |
| 400 | Hết giờ | exam_time_expired |
| 401 | Chưa xác thực | invalid_token |
| 404 | Phiên thi không tìm thấy | session_not_found |

---

### 6.3 Business Rules Anti-Cheat

| BR | Mô tả |
|---|---|
| BR-AC01 | Server-side timer: `StartAt` gán bởi server, `DurationSeconds` từ config. Client chỉ hiển thị, không kiểm soát. |
| BR-AC02 | `ViolationCount` server-managed. Client không được gửi số lần vi phạm trong request. |
| BR-AC03 | Vi phạm >= 3 → ForceSubmit tự động, `Status = ForceSubmitted`. |
| BR-AC04 | Đề thi xáo trộn server-side. `Answer.IsCorrect` KHÔNG serialize ra JSON response. |
| BR-AC05 | `visibilitychange` API: phát hiện tab switch client-side → gọi API violation ngay lập tức. |
| BR-AC06 | Fullscreen bắt buộc: auto-enter khi mount (sau 300ms), phát hiện thoát qua `fullscreenchange`. |
| BR-AC07 | Chặn: copy, paste, cut, chuột phải, Ctrl+A, Ctrl+P, F12, Ctrl+Shift+I/J/C (capture phase). |
| BR-AC08 | Heartbeat API gọi mỗi 30s: đồng bộ timer và trạng thái phiên. |

---

## 7. Phân hệ Bài tập & File Upload (Assignment)

> **Chỉ `StudentOnly` Policy**

### 7.1 UC-08: Nộp bài tập

**Endpoint:** `POST /api/assignments/{id:guid}/submit`  
**Content-Type:** `multipart/form-data`  
**Hard Limit:** `RequestSizeLimit(52_428_800)` = 50 MB + overhead

**Pipeline xử lý bảo mật (7 bước theo thứ tự):**

| Bước | Kiểm tra | Lỗi nếu fail |
|---|---|---|
| 1 | JWT Claims → extract `StudentId` | HTTP 401 |
| 2 | Assignment tồn tại trong DB | HTTP 404 `assignment_not_found` |
| 3 | Chưa nộp trùng `(assignmentId, studentId)` | HTTP 409 `already_submitted` |
| 4 | `file.Length > 0 AND <= 50 MB` | HTTP 400 `file_too_large` |
| 5 | MIME validation bằng **magic bytes** (8 bytes đầu) | HTTP 422 `invalid_mime_type` |
| 6 | ClamAV virus scan (TCP INSTREAM) | HTTP 422 `virus_detected` |
| 7 | AES-256-CBC encrypt + upload MinIO với UUID key | — |

**MIME Types được phép (Allow-list):**

| Extension | MIME Type | Magic Bytes |
|---|---|---|
| .pdf | application/pdf | `%PDF-` (25 50 44 46 2D) |
| .doc | application/msword | OLE2: D0 CF 11 E0 A1 B1 1A E1 |
| .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document | PK: 50 4B 03 04 |
| .xls | application/vnd.ms-excel | OLE2: D0 CF 11 E0... |
| .xlsx | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | PK: 50 4B 03 04 |
| .ppt | application/vnd.ms-powerpoint | OLE2: D0 CF 11 E0... |
| .pptx | application/vnd.openxmlformats-officedocument.presentationml.presentation | PK: 50 4B 03 04 |
| .zip | application/zip | PK: 50 4B 03/05/07 04/06/08 |
| .rar | application/x-rar-compressed / application/vnd.rar | Rar!: 52 61 72 21 1A 07 |
| .jpg/.jpeg | image/jpeg | FF D8 FF |
| .png | image/png | 89 50 4E 47 0D 0A 1A 0A |

**StorageKey format:** `assignments/{assignmentId}/{Guid.NewGuid():N}.enc`

**HTTP Responses:**

| Code | Điều kiện | Error Key |
|---|---|---|
| 201 | Nộp thành công | — |
| 400 | File rỗng / kích thước vượt 50 MB | file_required / file_too_large |
| 401 | Chưa xác thực | — |
| 404 | Assignment không tồn tại | assignment_not_found |
| 409 | Đã nộp bài này rồi | already_submitted |
| 422 | MIME type không hợp lệ (magic bytes) | invalid_mime_type |
| 422 | ClamAV phát hiện virus | virus_detected |

---

### 7.2 Business Rules File Upload

| BR | Mô tả |
|---|---|
| BR-16 | Mỗi sinh viên chỉ được nộp một lần cho mỗi bài tập (unique constraint trên `assignmentId + studentId`). |
| BR-17 | MIME type kiểm tra bằng magic bytes (8 bytes đầu), không tin header `Content-Type`. Extension kiểm tra là defence-in-depth. |
| BR-18 | Kích thước file tối đa 50 MB (cả ở FluentValidation lẫn `RequestSizeLimit`). |
| BR-19 | File được đổi tên thành UUID trước khi lưu (Path Traversal Prevention). |
| BR-20 | File được mã hoá AES-256-CBC (IV ngẫu nhiên 16 bytes ghép vào đầu) trước khi lưu Storage. |
| BR-21 | ClamAV INSTREAM protocol: gửi file theo chunk 4096 bytes. Từ chối nếu response KHÔNG kết thúc bằng `"OK"`. |

---

## 8. Phân hệ Video Bài giảng (Video)

> **Policy `AnyAuthenticated`** — Student, Instructor, Admin đều xem được.

### 8.1 UC-09: Lấy Signed URL để phát video

**Endpoint:** `GET /api/videos/signed-url?videoPath={path}`

**Luồng:**
1. Validate `videoPath` không rỗng.
2. Extract `UserId` từ JWT Claims.
3. Sinh Signed URL: `HMAC-SHA256` của payload `"{videoPath}:{userId:N}:{expires}"`.
4. Trả `{url, expiresAt (Unix timestamp)}`.

**Cấu trúc URL:** `{BaseStreamUrl}/{videoPath}?userId={userId:N}&expires={unix}&sig={base64url}`

**Business Rules:**
- TTL mặc định **4 giờ** (cấu hình `VideoSigningOptions.DefaultTtlHours`).
- URL bind với `UserId` → không thể chia sẻ giữa các tài khoản.
- `ValidateSignedUrl()` dùng constant-time compare (`CryptographicOperations.FixedTimeEquals`).

### 8.2 UC-10: Validate Signed URL (Internal)

**Endpoint:** `GET /api/videos/validate` — `[AllowAnonymous]`, ẩn khỏi Swagger.  
Dùng cho proxy/middleware xác thực chữ ký trước khi stream video.

### 8.3 Canvas Watermark (Frontend)

- `SecureVideoPlayer` component render `<canvas>` phủ lên `<video>`, `pointer-events: none`.
- Nội dung watermark: `"{userId} · {timestamp vi-VN}"`, xoay **-45°**, màu trắng `rgba(255,255,255,0.18)`.
- Vẽ **một lần duy nhất** (không RAF loop) bằng OffscreenCanvas (fallback: canvas DOM).
- Ngăn chuột phải, kéo thả, download, PiP (`controlsList="nodownload nofullscreen noremoteplayback"`, `disablePictureInPicture`).
- Tự refresh Signed URL trước **5 phút** khi hết hạn.

---

## 9. Phân hệ Thông báo (Notification)

| Endpoint | Method | Mô tả |
|---|---|---|
| `GET /api/notifications?limit=50&unreadOnly=false` | GET | Lấy danh sách thông báo của user đang đăng nhập |
| `PATCH /api/notifications/{id:guid}/read` | PATCH | Đánh dấu một thông báo đã đọc |
| `POST /api/notifications/mark-all-read` | POST | Đánh dấu tất cả đã đọc |

**Auth:** `[Authorize]` — bất kỳ role nào.  
**IDOR Prevention:** `UserId` lấy từ `JWT Claims` (`GetRequiredUserId()`).  
**Query params:** `limit` (default 50), `unreadOnly` (default false).

---

## 10. Nhật ký Kiểm toán Bất biến (Audit Log)

### 10.1 Cơ chế ghi log

**`AuditMiddleware`** chạy sau `UseAuthorization()`, ghi log cho mọi request với HTTP method: `POST, PUT, PATCH, DELETE`.

**Format Action:** `"METHOD /path -> statusCode"` (VD: `"POST /api/auth/login -> 200"`)

**Payload HMAC:** `"{logId:D}|{timestamp:O}|{actorId}|{action}|{ip}"`

**IP Detection:** Ưu tiên `X-Forwarded-For` (header đầu tiên khi có proxy), fallback `Connection.RemoteIpAddress`.

### 10.2 Cơ chế Bất biến

- **DB Trigger:** `trg_AuditLogs_BlockUpdate` và `trg_AuditLogs_BlockDelete` — cấm hoàn toàn `UPDATE`/`DELETE` ở DB level.
- **EF Config:** `ValueGeneratedNever` (không auto-increment, Guid do server tạo).
- **Chữ ký HMAC-SHA256:** Mỗi bản ghi được ký với server secret key (Base64). Không thể sửa nội dung mà không bị phát hiện.

### 10.3 Index

- `HasIndex(x => x.ActorID)` — tìm kiếm theo user nhanh.
- `HasIndex(x => x.Timestamp)` — lọc theo thời gian nhanh.

---

## 11. Middleware Pipeline & Bảo mật Hạ tầng

### 11.1 Thứ tự Pipeline (Program.cs)

```
UseAuthentication()           → ASP.NET Core validate chữ ký JWT + lifetime
UseMiddleware<JwtBlacklistMiddleware>()  → kiểm tra JTI/User trong Redis Blacklist
UseAuthorization()            → kiểm tra Policy/Role
AuditMiddleware               → ghi log sau response (fire-and-forget)
```

### 11.2 JwtBlacklistMiddleware

**Hai lớp kiểm tra:**

| Kiểm tra | Redis Key | Kết quả nếu tìm thấy |
|---|---|---|
| JTI Blacklist | `jti_blacklist:{jti}` | HTTP 401 `token_revoked` |
| User Revoke | `user_revoked:{userId:N}` | HTTP 401 `session_revoked` |

**Fail-safe:** Nếu Redis down → `IsBlacklistedAsync` trả `false` (cho phép request đi qua — ưu tiên availability).

### 11.3 Redis Key Conventions

| Key | TTL | Mô tả |
|---|---|---|
| `jti_blacklist:{jti}` | Thời gian sống còn lại của Access Token | Logout blacklist |
| `user_revoked:{userId:N}` | 8 ngày | Revoke toàn bộ session (reuse attack) |

### 11.4 JWT Configuration

| Thông số | Giá trị |
|---|---|
| Algorithm | RS256 (RSA-SHA256) |
| Access Token TTL | 15 phút |
| Refresh Token TTL | 7 ngày |
| Claims | `sub` (userId), `email`, `role`, `jti`, `iat` |
| Private Key | PEM string từ config (`JwtSettings.PrivateKeyPem`) |

### 11.5 Frontend Token Management (apiClient.ts)

- Token lưu trong `localStorage`: key `access_token`, `refresh_token`.
- Response interceptor: nếu nhận `HTTP 401` và chưa retry → tự động gọi `POST /api/auth/refresh`.
- Nếu refresh thất bại → `localStorage.clear()` + redirect `/login`.

---

## 12. Frontend — Anti-Cheat Hooks

### 12.1 `useTabDetection`

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `examSessionId` | `string` | ID phiên thi — bắt buộc |
| `onMaxViolations` | `() => void` | Callback khi đạt `MAX_VIOLATIONS = 3` |

**Return:** `{ violationCount, isWarningVisible, dismissWarning }`

**Logic:**
- Lắng nghe `visibilitychange` event.
- Khi `document.visibilityState === 'hidden'`: tăng counter cục bộ → gọi `POST /exams/sessions/{id}/violations` (bất đồng bộ, không block UI) → hiển thị warning → nếu `>= 3` gọi `onMaxViolations`.
- Dùng `useRef` để đọc giá trị mới nhất trong event handler.

### 12.2 `useFullscreen`

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `targetRef` | `React.RefObject<HTMLElement>` | Element cần fullscreen |
| `onExitFullscreen` | `() => void` | Callback khi thoát |

**Return:** `{ isFullscreen, isExitWarningVisible, enterFullscreen, handleReenter, dismissExitWarning }`

**Logic:**
- Auto-enter fullscreen sau `300ms` khi mount (delay để có user gesture).
- Cross-browser: `requestFullscreen`, `webkitRequestFullscreen`, `mozRequestFullScreen`, `msRequestFullscreen`.
- Lắng nghe `fullscreenchange` (+ vendor prefixes).
- Khi thoát → hiển thị `isExitWarningVisible = true` + callback.

### 12.3 `useAntiCheat`

| Hành vi chặn | Event |
|---|---|
| Copy (Ctrl+C) | `copy` |
| Paste (Ctrl+V) | `paste` |
| Cut (Ctrl+X) | `cut` |
| Chuột phải | `contextmenu` |
| Chọn tất cả (Ctrl/Cmd+A) | `keydown` |
| In trang (Ctrl/Cmd+P) | `keydown` |
| Kéo thả | `dragstart` |
| F12, Ctrl+Shift+I/J/C | `keydown` |

- Tất cả listener đăng ký ở **capture phase** (`{ capture: true }`) để chặn trước bubble.
- Cleanup đầy đủ khi `enabled = false` hoặc unmount.

---

## 13. Business Rules Tổng hợp

| ID | Phân hệ | Mô tả |
|---|---|---|
| BR-01 | Auth | Mật khẩu hash Argon2id, constant-time compare |
| BR-02 | Auth | Khoá tài khoản 15 phút sau 5 lần đăng nhập sai liên tiếp |
| BR-03 | Auth | Access Token JWT RS256, TTL 15 phút |
| BR-04 | Auth | Refresh Token UUID, TTL 7 ngày, Rotation mỗi lần dùng |
| BR-05 | Auth | Reuse Detection: dùng lại Refresh Token cũ → revoke toàn bộ session |
| BR-06 | Auth | Logout → JTI vào Redis Blacklist với TTL còn lại |
| BR-07 | Auth | Email normalize: lowercase + trim (chống phân biệt hoa thường) |
| BR-08 | Auth | Message lỗi đăng nhập chung chung (chống User Enumeration) |
| BR-09 | RBAC | UserID LUÔN từ JWT Claims, KHÔNG từ URL/body/query |
| BR-10 | RBAC | Policy: StudentOnly, InstructorOnly, AdminOnly, InstructorOrAdmin, AnyAuthenticated |
| BR-11 | Exam | Timer tính server-side từ `StartAt + DurationSeconds` |
| BR-12 | Exam | Heartbeat mỗi 30s — server là nguồn chân lý duy nhất về thời gian |
| BR-13 | Exam | ViolationCount server-managed, không nhận từ client |
| BR-14 | Exam | Vi phạm >= 3 → ForceSubmit tự động |
| BR-15 | Exam | `Answer.IsCorrect` không serialize ra client |
| BR-16 | Assignment | Không nộp trùng (unique: assignmentId + studentId) |
| BR-17 | Assignment | MIME validation bằng magic bytes |
| BR-18 | Assignment | Kích thước file tối đa 50 MB |
| BR-19 | Assignment | StorageKey là UUID (Path Traversal Prevention) |
| BR-20 | Assignment | File mã hoá AES-256-CBC trước khi lưu Storage |
| BR-21 | Assignment | ClamAV virus scan bắt buộc |
| BR-22 | Video | Signed URL HMAC-SHA256, TTL 4h, bind với UserId |
| BR-23 | Video | Canvas watermark: `{userId} · {timestamp}`, xoay -45° |
| BR-24 | Audit | Mọi POST/PUT/PATCH/DELETE ghi audit log (fire-and-forget) |
| BR-25 | Audit | Bản ghi audit ký HMAC-SHA256, trigger DB chặn UPDATE/DELETE |
| BR-26 | Redis | `jti_blacklist:*` TTL = thời gian sống còn lại của token |
| BR-27 | Redis | `user_revoked:*` TTL = 8 ngày |

---

## 14. API Endpoints Tổng hợp

| Endpoint | Method | Auth Policy | Mô tả |
|---|---|---|---|
| `/api/auth/login` | POST | Anonymous | Đăng nhập |
| `/api/auth/refresh` | POST | Anonymous | Làm mới token |
| `/api/auth/logout` | POST | AnyAuthenticated | Đăng xuất |
| `/api/profile/security/password` | PUT | AnyAuthenticated | Đổi mật khẩu |
| `/api/profile/security/2fa` | GET | AnyAuthenticated | Lấy trạng thái 2FA |
| `/api/profile/security/2fa/setup` | GET | AnyAuthenticated | Sinh secret 2FA |
| `/api/profile/security/2fa/verify` | POST | AnyAuthenticated | Xác thực + bật 2FA |
| `/api/profile/security/2fa` | DELETE | AnyAuthenticated | Tắt 2FA |
| `/api/exam/{id}/heartbeat` | POST | StudentOnly | Heartbeat đồng bộ timer |
| `/api/exam/{id}/violation` | POST | StudentOnly | Báo cáo vi phạm |
| `/api/assignments/{id}/submit` | POST | StudentOnly | Nộp bài tập |
| `/api/videos/signed-url` | GET | AnyAuthenticated | Lấy Signed URL |
| `/api/videos/validate` | GET | Anonymous (Internal) | Validate chữ ký URL |
| `/api/notifications` | GET | AnyAuthenticated | Lấy thông báo |
| `/api/notifications/{id}/read` | PATCH | AnyAuthenticated | Đánh dấu đã đọc |
| `/api/notifications/mark-all-read` | POST | AnyAuthenticated | Đánh dấu tất cả đã đọc |
