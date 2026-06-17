using System.Security.Cryptography;
using LMS.Application;
using LMS.Infrastructure;
using LMS.Infrastructure.Auth;
using LMS.Infrastructure.Persistence;
using LMS.API.Middlewares;
using LMS.API.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Azure.Identity;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// ── Azure Key Vault (Nguyên tắc 2: Secret Manager) ──────────────────────────
var keyVaultUri = builder.Configuration["KeyVault:VaultUri"];
if (!string.IsNullOrWhiteSpace(keyVaultUri))
{
    builder.Configuration.AddAzureKeyVault(
        new Uri(keyVaultUri),
        new DefaultAzureCredential());
}

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 104_857_600; // 100 MB
});

// ── Application + Infrastructure services ─────────────────────────────────────
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ── JWT Bearer Authentication (đặt tại API layer vì dùng ASP.NET Core packages) ──
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptionsMonitor<JwtSettings>>((options, jwtSettingsMonitor) =>
    {
        var initialSettings = jwtSettingsMonitor.CurrentValue;
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidIssuer              = initialSettings.Issuer,
            ValidateAudience         = true,
            ValidAudience            = initialSettings.Audience,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ClockSkew                = TimeSpan.Zero,  // 15p là chính xác, không cho skew
            RequireExpirationTime    = true,
            // Sử dụng Resolver để tự động lấy Public Key mới nhất khi Key Vault thay đổi (Rotation)
            IssuerSigningKeyResolver = (token, securityToken, kid, validationParameters) =>
            {
                var currentSettings = jwtSettingsMonitor.CurrentValue;
                if (string.IsNullOrWhiteSpace(currentSettings.PublicKeyPem) || currentSettings.PublicKeyPem.Contains("REPLACE_WITH"))
                    throw new SecurityTokenSignatureKeyNotFoundException("Public Key chưa được nạp từ Secret Manager.");

                var rsa = RSA.Create();
                rsa.ImportFromPem(currentSettings.PublicKeyPem.AsSpan());
                return new[] { new RsaSecurityKey(rsa) };
            }
        };
        options.MapInboundClaims = false; // giữ nguyên "sub", "email" (không map sang ClaimTypes)
    });

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

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

// ── CORS ──────────────────────────────────────────────────────────────────────
// Đọc danh sách origin cho phép từ cấu hình (appsettings / env vars).
// Production: set Cors__AllowedOrigins__0=https://... trong Render environment.
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy("LmsPolicy", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()       // Authorization, Content-Type, …
              .AllowAnyMethod()       // GET, POST, PUT, DELETE, OPTIONS
              .AllowCredentials();    // Cookie / Authorization header
    });
});

// ── App Pipeline ──────────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();

// CORS phải đứng TRƯỚC Authentication/Authorization để preflight OPTIONS được xử lý đúng.
app.UseCors("LmsPolicy");

// Global exception handler – đặt sau UseCors để lỗi vẫn trả về CORS headers.
app.UseExceptionHandler(errApp => errApp.Run(async ctx =>
{
    var exceptionHandlerPathFeature = ctx.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
    var exception = exceptionHandlerPathFeature?.Error;

    if (exception is UnauthorizedAccessException)
    {
        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsJsonAsync(new { error = "unauthorized", message = exception.Message });
        return;
    }

    ctx.Response.StatusCode  = StatusCodes.Status500InternalServerError;
    ctx.Response.ContentType = "application/json";
    await ctx.Response.WriteAsJsonAsync(new { error = "internal_server_error", message = "Đã xảy ra lỗi phía server." });
}));

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

// ── Health endpoint (không cần auth, dùng để debug trên Render) ──────────────
app.MapGet("/health", async (AppDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        return Results.Ok(new { status = "ok", database = canConnect ? "connected" : "unreachable" });
    }
    catch (Exception ex)
    {
        return Results.Json(
            new { status = "degraded", database = "error", detail = ex.Message },
            statusCode: 503);
    }
}).AllowAnonymous();

// ── Migrate & Seed (chạy sau khi app được build, trước app.Run()) ────────────
// MigrateAsync() PHẢI chạy trước SeedAsync() để đảm bảo tất cả bảng đã tồn tại.
// Idempotent: EF Core tự bỏ qua migration đã được áp dụng.
await using (var scope = app.Services.CreateAsyncScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
                     .CreateLogger("Startup");
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        logger.LogInformation("Applying EF Core migrations...");
        await dbContext.Database.MigrateAsync();   // ← tạo bảng nếu chưa có
        logger.LogInformation("Migrations applied. Running seeder...");

        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        await seeder.SeedAsync();
        logger.LogInformation("Seeder completed.");
    }
    catch (Exception ex)
    {
        // Log lỗi nhưng KHÔNG crash app – endpoint /health vẫn trả về
        // thông tin để debug; các endpoint khác sẽ thất bại gracefully.
        logger.LogError(ex, "Startup migration/seed failed: {Message}", ex.Message);
    }
}

app.Run();
