using LMS.Domain.Interfaces;
using LMS.Infrastructure.Audit;
using LMS.Infrastructure.Auth;
using LMS.Infrastructure.Persistence;
using LMS.Infrastructure.Persistence.Repositories;
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
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)
            ));

        // ── Redis ─────────────────────────────────────────────────────────────
        // Connection string ví dụ: "localhost:6379,password=secret,ssl=False,abortConnect=False"
        var redisConn = configuration.GetConnectionString("Redis")
            ?? throw new InvalidOperationException("Thiếu ConnectionStrings:Redis trong cấu hình.");

        services.AddSingleton<IConnectionMultiplexer>(
            ConnectionMultiplexer.Connect(redisConn));

        // ── Auth Services ─────────────────────────────────────────────────────
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, Argon2idPasswordHasher>();

        // Blacklist: Singleton vì IConnectionMultiplexer là thread-safe
        services.AddSingleton<ITokenBlacklistService, RedisTokenBlacklistService>();

        // ── Repositories ──────────────────────────────────────────────────────
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IExamSessionRepository, ExamSessionRepository>();
        services.AddScoped<IAssignmentRepository, AssignmentRepository>();
        services.AddScoped<IAssignmentSubmissionRepository, AssignmentSubmissionRepository>();

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
}
