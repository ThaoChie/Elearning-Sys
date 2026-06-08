# 📘 TUTORIAL — Hướng Dẫn Vận Hành LMS

> **Stack:** ASP.NET Core 10 · PostgreSQL (Aiven) · Redis · MinIO · Render · Vercel

---

## 1. Đăng nhập lần đầu với Admin

Tài khoản Admin mặc định được seed tự động khi ứng dụng khởi động lần đầu.

| Trường   | Giá trị                  |
|----------|--------------------------|
| Email    | `admin@elearning.com`    |
| Password | `Password123!`           |

### Các bước:

1. Truy cập Swagger UI: `https://<your-render-domain>/swagger/index.html`
2. Gọi `POST /api/auth/login` với body:
   ```json
   {
     "email": "admin@elearning.com",
     "password": "Password123!"
   }
   ```
3. Copy `accessToken` từ response.
4. Click **Authorize** (nút 🔒 góc trên phải Swagger), paste token vào ô `Bearer <token>`.
5. Giờ bạn có thể gọi tất cả API cần quyền Admin.

> ⚠️ **Bảo mật:** Đổi mật khẩu Admin ngay sau lần đăng nhập đầu tiên trên môi trường Production.

---

## 2. Cấu trúc thư mục (4-Layer Architecture)

```
backend/src/
├── LMS.API/                    # Presentation Layer
│   ├── Controllers/            # HTTP endpoints (REST)
│   ├── Middlewares/            # JWT Blacklist, Audit, ValidationException
│   └── Extensions/             # ClaimsPrincipal, AuthPolicies helpers
│
├── LMS.Application/            # Application Layer (Use Cases)
│   ├── Commands/               # Write operations (CQRS Command + Handler)
│   ├── Queries/                # Read operations  (CQRS Query  + Handler)
│   └── Validators/             # FluentValidation rules
│
├── LMS.Domain/                 # Domain Layer (Business Rules)
│   ├── Entities/               # User, Course, Module, Lecture, Quiz, ...
│   ├── Interfaces/             # IPasswordHasher, ITokenService, ...
│   └── Exceptions/             # Domain-specific exceptions
│
└── LMS.Infrastructure/         # Infrastructure Layer
    ├── Auth/                   # Argon2id hasher, JWT RS256, Redis blacklist
    ├── Persistence/            # EF Core DbContext, Repositories, Migrations
    │   ├── Configurations/     # IEntityTypeConfiguration per entity
    │   ├── Migrations/         # EF Core migration files
    │   ├── Repositories/       # Concrete repository implementations
    │   └── DataSeeder.cs       # Seed dữ liệu mẫu (idempotent)
    ├── Security/               # File security (magic bytes, ClamAV, AES-256)
    ├── Storage/                # MinIO + HMAC Signed URL
    └── Audit/                  # Immutable audit log + HMAC-SHA256 signing
```

---

## 3. Chạy Migration và Seed dữ liệu

### 3.1 Yêu cầu

- .NET 10 SDK: `dotnet --version` ≥ 10.0
- EF Core Tools: `dotnet tool install --global dotnet-ef`
- Biến môi trường `ConnectionStrings__DefaultConnection` trỏ đến PostgreSQL

### 3.2 Tạo Migration mới

```bash
# Chạy từ thư mục gốc của solution (backend/)
dotnet ef migrations add <TênMigration> \
  --project src/LMS.Infrastructure \
  --startup-project src/LMS.API
```

Ví dụ:
```bash
dotnet ef migrations add AddCourseLectureQuiz \
  --project src/LMS.Infrastructure \
  --startup-project src/LMS.API
```

### 3.3 Áp dụng Migration lên database

```bash
dotnet ef database update \
  --project src/LMS.Infrastructure \
  --startup-project src/LMS.API
```

### 3.4 Seed dữ liệu

Seed chạy **tự động** khi ứng dụng khởi động (`DataSeeder.SeedAsync()` được gọi trong `Program.cs`).

- Nếu DB **chưa có dữ liệu** → Seed tạo Admin, Instructor, Student, Course, Modules, Lectures, Quiz.
- Nếu DB **đã có dữ liệu** → Bỏ qua (idempotent, không tạo trùng).

Để **reset và seed lại từ đầu** (chỉ làm trên môi trường dev):
```bash
dotnet ef database drop --project src/LMS.Infrastructure --startup-project src/LMS.API
dotnet ef database update --project src/LMS.Infrastructure --startup-project src/LMS.API
dotnet run --project src/LMS.API  # seed tự động khi start
```

### 3.5 Liệt kê các migration hiện có

```bash
dotnet ef migrations list \
  --project src/LMS.Infrastructure \
  --startup-project src/LMS.API
```

---

## 4. Xem logs trên Render khi gặp lỗi 500

### Cách 1: Render Dashboard (dễ nhất)

1. Đăng nhập [dashboard.render.com](https://dashboard.render.com)
2. Chọn service **lms-api**
3. Click tab **Logs** ở thanh điều hướng bên trái
4. Tìm dòng có `Exception`, `Error`, hoặc `500`

### Cách 2: Render CLI

```bash
render logs --service lms-api --tail
```

### Cách 3: Lọc logs theo mức độ

Trong Render Dashboard → Logs, dùng ô **Filter** để tìm:

| Từ khóa tìm kiếm | Ý nghĩa                      |
|------------------|------------------------------|
| `Exception`      | Lỗi chưa được xử lý          |
| `NETSDK`         | Lỗi build .NET               |
| `fail:`          | Log cấp ERROR của ASP.NET    |
| `DataSeeder`     | Log từ quá trình seed        |
| `Unhandled`      | Lỗi nghiêm trọng (crash)     |

### Mẹo debug lỗi 500 phổ biến

| Lỗi                              | Nguyên nhân thường gặp                   |
|----------------------------------|------------------------------------------|
| `Connection refused`             | Biến môi trường DB/Redis chưa set        |
| `relation "Users" does not exist`| Chưa chạy `ef database update`          |
| `Invalid token`                  | Thiếu `Jwt__PrivateKeyPem` env var       |
| `Object reference not set`       | Thiếu config section trong `appsettings` |

---

## 5. Test API bằng Swagger

### Truy cập Swagger UI

```
https://<your-render-domain>/swagger/index.html
```

Ví dụ: `https://lms-api.onrender.com/swagger/index.html`

> ⚠️ Swagger chỉ available trong môi trường `Development`. Trên Production (Render), cần bật thêm:
> ```csharp
> // Program.cs – thêm điều kiện hoặc bỏ điều kiện if (IsDevelopment)
> app.MapOpenApi(); // bỏ điều kiện để luôn hiện
> ```

### Quy trình test API có authentication

```
1. POST /api/auth/login          → Lấy accessToken
2. Click 🔒 Authorize (góc phải)
3. Nhập: Bearer <accessToken>
4. Gọi bất kỳ endpoint cần auth
```

### Các endpoint quan trọng để test

| Method | Endpoint                        | Mô tả                          | Auth      |
|--------|---------------------------------|--------------------------------|-----------|
| POST   | `/api/auth/login`               | Đăng nhập, lấy JWT             | Public    |
| POST   | `/api/auth/refresh`             | Làm mới Access Token           | Public    |
| POST   | `/api/auth/logout`              | Đăng xuất, blacklist token     | Required  |
| GET    | `/api/courses`                  | Danh sách khoá học             | Required  |
| POST   | `/api/assignments/{id}/submit`  | Nộp bài tập                    | Student   |
| GET    | `/api/admin/audit-logs`         | Xem Audit Log                  | Admin     |

---

## 6. Tài khoản mẫu sau khi Seed

| Role       | Email                              | Password         |
|------------|------------------------------------|------------------|
| Admin      | `admin@elearning.com`              | `Password123!`   |
| Instructor | *(random Bogus, xem logs startup)* | `Instructor@123` |
| Student    | *(random Bogus, xem logs startup)* | `Student@123`    |

> Email của Instructor và Student được sinh ngẫu nhiên bằng thư viện **Bogus** với seed cố định `42`.
> Xem email chính xác trong Render Logs khi ứng dụng khởi động lần đầu:
> ```
> DataSeeder: Seed hoàn tất. Admin=admin@elearning.com, Instructor=..., Student=...
> ```
