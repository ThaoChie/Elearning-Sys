using System.Security.Cryptography;
using LMS.Application;
using LMS.Infrastructure;
using LMS.Infrastructure.Auth;
using LMS.API.Middlewares;
using LMS.API.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── Application + Infrastructure services ─────────────────────────────────────
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ── JWT Bearer Authentication (đặt tại API layer vì dùng ASP.NET Core packages) ──
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
    ?? throw new InvalidOperationException("Thiếu cấu hình Jwt trong appsettings.");

var rsa = RSA.Create();
rsa.ImportFromPem(jwtSettings.PublicKeyPem.AsSpan());
var publicKey = new RsaSecurityKey(rsa);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidIssuer              = jwtSettings.Issuer,
            ValidateAudience         = true,
            ValidAudience            = jwtSettings.Audience,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = publicKey,
            ClockSkew                = TimeSpan.Zero,  // 15p là chính xác, không cho skew
            RequireExpirationTime    = true,
        };
        options.MapInboundClaims = false; // giữ nguyên "sub", "email" (không map sang ClaimTypes)
    });

builder.Services.AddAuthorization(options =>
{
    // ── Policy-based RBAC ──────────────────────────────────────────────────────
    // Mỗi Policy yêu cầu JWT hợp lệ VÀ claim "role" đúng giá trị.
    // Claim "role" được phát hành bởi JwtTokenService từ User.Role (DB) – không tin client input.

    options.AddPolicy(AuthPolicies.StudentOnly, policy =>
        policy.RequireAuthenticatedUser()
              .RequireClaim(ClaimsPrincipalExtensions.ClaimRole,
                            ClaimsPrincipalExtensions.RoleStudent));

    options.AddPolicy(AuthPolicies.InstructorOnly, policy =>
        policy.RequireAuthenticatedUser()
              .RequireClaim(ClaimsPrincipalExtensions.ClaimRole,
                            ClaimsPrincipalExtensions.RoleInstructor));

    options.AddPolicy(AuthPolicies.AdminOnly, policy =>
        policy.RequireAuthenticatedUser()
              .RequireClaim(ClaimsPrincipalExtensions.ClaimRole,
                            ClaimsPrincipalExtensions.RoleAdmin));

    // Instructor hoặc Admin (quản lý khoá học, chấm bài)
    options.AddPolicy(AuthPolicies.InstructorOrAdmin, policy =>
        policy.RequireAuthenticatedUser()
              .RequireClaim(ClaimsPrincipalExtensions.ClaimRole,
                            ClaimsPrincipalExtensions.RoleInstructor,
                            ClaimsPrincipalExtensions.RoleAdmin));

    // Bất kỳ authenticated user nào (Student | Instructor | Admin)
    options.AddPolicy(AuthPolicies.AnyAuthenticated, policy =>
        policy.RequireAuthenticatedUser());
});
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// ── App Pipeline ──────────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();

// Bắt FluentValidation.ValidationException → HTTP 400
app.UseMiddleware<ValidationExceptionMiddleware>();

// Ghi Audit Log cho POST, PUT, PATCH, DELETE
app.UseMiddleware<AuditMiddleware>();

app.UseAuthentication();

// ── JWT Blacklist Check (sau Authentication, trước Authorization) ──────────────
// Từ chối token có JTI trong Redis Blacklist hoặc User bị revoke toàn bộ.
app.UseMiddleware<JwtBlacklistMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
