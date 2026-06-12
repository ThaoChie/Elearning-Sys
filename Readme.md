# HỆ THỐNG QUẢN LÝ HỌC TRỰC TUYẾN (LMS) - SECURITY FOCUSED
**Mục tiêu:** Xây dựng hệ thống LMS với trọng tâm là An ninh thông tin, chống gian lận và bảo vệ dữ liệu toàn diện (CIA Triad: Confidentiality, Integrity, Authentication).

## 1. TECH STACK VÀ KIẾN TRÚC
* **Backend:** C# ASP.NET Core 8 Web API. Kiến trúc Layered (API, Application, Domain, Infrastructure) kết hợp CQRS (MediatR) và FluentValidation.
* **Frontend:** ReactJS 18 (TypeScript, Vite). Styling bằng Tailwind CSS.
* **Database:** PostgreSQL
* **Storage & Cache:** MinIO/Azure Blob Storage (Lưu trữ file an toàn), Redis 7 (Quản lý Session, Blacklist, Rate Limiting).
* **Design Pattern Front-end:** Tách biệt Hook (logic) và Component (UI). Áp dụng phong cách Modern Education & Data Dashboard (Glassmorphism, Card-based layout).

## 2. QUY TRÌNH BẢO MẬT CỐT LÕI (SECURITY CONTROLS)
Tất cả các tính năng được phát triển **BẮT BUỘC** phải tuân thủ các quy tắc bảo mật sau:

### 2.1. Xác thực & Quản lý Phiên (IAM & Sessions)
* **Mật khẩu:** Phải được Hash bằng `Argon2id` (chống Brute-force và Rainbow table). So sánh hash phải dùng *constant-time compare*.
* **Chống Brute-force:** Khóa tài khoản (Account Lockout) tạm thời 15 phút sau 5 lần đăng nhập sai liên tiếp.
* **Tokens:**
    * **Access Token:** `JWT RS256` (Public/Private key), thời hạn ngắn (15 phút).
    * **Refresh Token:** Chuỗi `UUID` ngẫu nhiên, thời hạn dài (7 ngày). **Bắt buộc** áp dụng cơ chế *Token Rotation* (Cấp mới cả Access và Refresh token mỗi khi renew) và *Reuse Detection* (Phát hiện dùng lại token cũ -> Revoke toàn bộ).
* **Đăng xuất (Logout):** Đẩy Access Token (JTI) vào *Redis Blacklist* với TTL bằng thời gian sống còn lại của token. Middleware phải từ chối token nằm trong Blacklist.

### 2.2. Phân quyền & Chống IDOR (Authorization)
* **Role-Based Access Control (RBAC):** Mọi API endpoint phải được bảo vệ bằng Policy-based Authorization (Student, Instructor, Admin).
* **Chống IDOR (Insecure Direct Object Reference) - NGUYÊN TẮC TỐI THƯỢNG:** Mọi thao tác truy vấn dữ liệu cá nhân, nộp bài, hoặc xem điểm **PHẢI** lấy `UserID` trực tiếp từ JWT Claims. **TUYỆT ĐỐI KHÔNG** lấy UserID từ URL parameters, query string hay request body.

### 2.3. Chống Gian Lận Thi Cử (Anti-Cheat Engine)
* **Phát đề thi:** Đề thi được xáo trộn tại Server. **TUYỆT ĐỐI KHÔNG** gửi kèm đáp án đúng trong JSON response.
* **Tab Switch Detection:** Sử dụng `visibilitychange` API của React. Quản lý `ViolationCount` cục bộ và đồng bộ lên Server. Vi phạm >= 3 lần -> Force Submit (Nộp bài ép buộc).
* **Fullscreen Enforcement:** Ép buộc chế độ Fullscreen bằng API trình duyệt. Chặn chuột phải (Context menu) và vô hiệu hóa copy-paste bằng CSS/JS.
* **Server-side Timer (Cực kỳ quan trọng):** Bộ đếm thời gian thi (Timer) **PHẢI** được tính toán tại Server (dựa trên `StartAt` và `TimeLimitMin`). Frontend có thể hiển thị đếm ngược nhưng Server là nguồn chân lý duy nhất. Đồng bộ thông qua API Heartbeat mỗi 30s.

### 2.4. Bảo vệ Nội dung & File Security (Content & Upload)
* **Video & Tài liệu bài giảng:** **TUYỆT ĐỐI KHÔNG** dùng Static URL. Phân phối qua `Signed URL` (có chữ ký `HMAC-SHA256`) với thời hạn tối đa 4 giờ.
* **Dynamic Watermark:** Chèn một thẻ `<canvas>` mờ đè lên `<video>` hoặc vùng làm bài thi, hiển thị `[UserID] + [Timestamp]` để chống quay lén màn hình.
* **Upload Bài tập:**
    1.  **MIME Validation:** Kiểm tra nội dung file thực tế (Magic bytes), không tin tưởng header `Content-Type`.
    2.  **Anti-Malware:** Tích hợp quét virus (`ClamAV`).
    3.  **Path Traversal Prevention:** Đổi tên file gốc thành chuỗi `UUID` trước khi lưu vào Storage.

### 2.5. Nhật ký Kiểm toán Bất biến (Immutable Audit Log)
* Mọi hành động nhạy cảm (Đăng nhập sai, Giao dịch, Đổi quyền, Nộp bài thi, Cập nhật điểm) **PHẢI** được ghi log.
* **Cấu trúc Log:** `{LogID, Timestamp, ActorID, Action, IP, HMACSignature}`.
* **Tính Toàn vẹn (Integrity):** Bản ghi log phải được ký bằng thuật toán `HMAC-SHA256` (băm nội dung log với một Secret Key của Server). Cơ sở dữ liệu cấu hình chặn hoàn toàn quyền `UPDATE/DELETE` trên bảng Audit Logs.

## 3. CẤU TRÚC THƯ MỤC CỐT LÕI
### Backend (`/backend/src/`)
* `LMS.API/`: Controllers, Middlewares (JwtAuth, ExceptionHandling, AuditMiddleware).
* `LMS.Application/`: CQRS (Commands, Queries, Handlers), FluentValidation Validators.
* `LMS.Domain/`: Entities, Interfaces, Domain Exceptions.
* `LMS.Infrastructure/`: EF Core DbContext, Repositories, Auth Services, Storage Services, Security Services (File, HMAC).

### Frontend (`/frontend/src/`)
* `components/`: Reusable UI elements (Card, Button, SecureVideoPlayer, ExamGuard).
* `pages/`: Views chức năng chính (Login, CourseDetail, ExamRoom, AdminAuditViewer).
* `hooks/`: Custom React Hooks xử lý logic bảo mật (`useTabDetection`, `useFullscreen`, `useHeartbeat`).
* `api/`: Cấu hình Axios, Interceptors xử lý tự động làm mới token (Token Refresh).

## 4. QUY TẮC DÀNH CHO CLAUDE CODE CLI
1.  **Mệnh Lệnh Cách Ly:** Tuân thủ chặt chẽ việc phân chia các tác vụ theo từng module nhỏ (Vertical Slices). Chỉ làm việc trong thư mục và file được chỉ định trong prompt. KHÔNG quét (read/ls) toàn bộ dự án nếu không được yêu cầu.
2.  **Chấp hành Security Controls:** Mọi đoạn code sinh ra phải ngầm định áp dụng các nguyên tắc ở Phần 2. Không được phép bypass các cơ chế bảo mật (như hash mật khẩu hay JWT validation) vì bất kỳ lý do gì.
3.  **Tối ưu Token:** Yêu cầu người dùng (User) sử dụng lệnh `/clear` sau khi hoàn thành một chức năng độc lập để dọn dẹp ngữ cảnh (context), giữ cho tốc độ xử lý nhanh và tiết kiệm chi phí.
4.  **Báo cáo Lỗi Thiếu Sót:** Nếu User yêu cầu xây dựng một chức năng mà theo SRS cần kiểm tra quyền truy cập (RBAC) nhưng prompt lại thiếu, Claude phải chủ động bổ sung logic RBAC đó.
