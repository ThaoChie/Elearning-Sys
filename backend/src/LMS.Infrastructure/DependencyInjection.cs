using LMS.Application.Features.Quiz.Services;
using LMS.Domain.Interfaces;
using LMS.Infrastructure.Audit;
using LMS.Infrastructure.Auth;
using LMS.Infrastructure.Persistence;
using LMS.Infrastructure.Persistence.Repositories;
using LMS.Infrastructure.Persistence.Services;
using LMS.Infrastructure.Security;
using LMS.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Minio;
using StackExchange.Redis;

namespace LMS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── Database ──────────────────────────────────────────────────────────
        // Hỗ trợ cả 2 định dạng connection string:
        //   - Key=Value (EF Core chuẩn): "Host=...;Database=...;Username=...;Password=..."
        //   - URL (Aiven/Render inject): "postgres://user:pass@host:port/db?sslmode=require"
        var rawConnStr = configuration.GetConnectionString("DefaultConnection") ?? "";
        var npgsqlConnStr = ConvertPostgresUrlToNpgsql(rawConnStr);

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                npgsqlConnStr,
                npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)
            ));

        // ── Redis ─────────────────────────────────────────────────────────────
        // Connection string ví dụ: "localhost:6379,password=secret,ssl=False,abortConnect=False"
        // Fallback "localhost:6379" giúp app khởi động khi Redis chưa được cấu hình;
        // AbortOnConnectFail=false đảm bảo không crash startup.
        var redisConn = configuration.GetConnectionString("Redis")
                        ?? configuration["Redis:ConnectionString"]
                        ?? "localhost:6379,abortConnect=False";

        var redisOptions = ConfigurationOptions.Parse(redisConn);
        redisOptions.AbortOnConnectFail = false;   // không crash startup nếu Redis chưa sẵn sàng
        redisOptions.ConnectRetry       = 3;
        redisOptions.ReconnectRetryPolicy = new ExponentialRetry(5000);

        services.AddSingleton<IConnectionMultiplexer>(
            ConnectionMultiplexer.Connect(redisOptions));

        // ── Auth Services ─────────────────────────────────────────────────────
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, Argon2idPasswordHasher>();
        services.AddScoped<IProfileService, ProfileService>();

        // Blacklist: Singleton vì IConnectionMultiplexer là thread-safe
        services.AddSingleton<ITokenBlacklistService, RedisTokenBlacklistService>();

        // ── Repositories ──────────────────────────────────────────────────────
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IExamSessionRepository, ExamSessionRepository>();
        services.AddScoped<IAssignmentRepository, AssignmentRepository>();
        services.AddScoped<IAssignmentSubmissionRepository, AssignmentSubmissionRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();

        // ── Feature Services ──────────────────────────────────────────────────
        services.AddScoped<IQuizService, QuizService>();

        // ── Storage / Video Signing ────────────────────────────────────────────
        services.Configure<VideoSigningOptions>(
            configuration.GetSection(VideoSigningOptions.SectionName));
        services.AddSingleton<IVideoSigningService, HmacVideoSigningService>();

        // ── Object Storage (MinIO) ─────────────────────────────────────────────
        services.Configure<StorageOptions>(
            configuration.GetSection(StorageOptions.SectionName));

        services.AddMinio(configureClient =>
        {
            var storageOpts = configuration
                .GetSection(StorageOptions.SectionName)
                .Get<StorageOptions>()!;

            configureClient
                .WithEndpoint(storageOpts.Endpoint)
                .WithCredentials(storageOpts.AccessKey, storageOpts.SecretKey)
                .WithSSL(storageOpts.UseSSL);
        });

        services.AddScoped<IStorageService, MinioStorageService>();

        // ── File Security (Magic Bytes + ClamAV + AES-256) ────────────────────
        services.Configure<FileSecurityOptions>(
            configuration.GetSection(FileSecurityOptions.SectionName));
        services.AddSingleton<IFileSecurityService, FileSecurityService>();

        // ── Audit Log ─────────────────────────────────────────────────────────
        services.Configure<AuditLogOptions>(
            configuration.GetSection(AuditLogOptions.SectionName));
        services.AddScoped<IAuditLogService, AuditLogService>();

        // ── Data Seeder ───────────────────────────────────────────────────────
        services.AddScoped<DataSeeder>();

        return services;
    }

    /// <summary>
    /// Chuyển đổi Postgres URL sang Npgsql Key=Value connection string.
    /// Aiven inject dạng: postgres://user:pass@host:port/db?sslmode=require
    /// Npgsql chỉ chấp nhận: Host=...;Port=...;Database=...;Username=...;Password=...;SSL Mode=Require
    /// Nếu đầu vào đã là Key=Value thì trả về nguyên vẹn.
    /// </summary>
    private static string ConvertPostgresUrlToNpgsql(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            return connectionString;

        // Đã là Key=Value format → trả về nguyên
        if (!connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return connectionString;

        var uri = new Uri(connectionString.Split('?')[0]); // bỏ query string trước khi parse

        var host     = uri.Host;
        var port     = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        var userInfo = uri.UserInfo.Split(':', 2);
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";

        // Lấy sslmode từ query string nếu có
        var sslMode = "Require"; // Aiven luôn yêu cầu SSL
        if (connectionString.Contains("sslmode=disable", StringComparison.OrdinalIgnoreCase))
            sslMode = "Disable";
        else if (connectionString.Contains("sslmode=prefer", StringComparison.OrdinalIgnoreCase))
            sslMode = "Prefer";

        return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode={sslMode};Trust Server Certificate=true";
    }
}
