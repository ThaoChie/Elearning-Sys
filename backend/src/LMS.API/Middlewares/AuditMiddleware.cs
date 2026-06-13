using System.Security.Claims;
using LMS.Domain.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace LMS.API.Middlewares;

public sealed class AuditMiddleware
{
    private static readonly HashSet<string> _auditedMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Post,
        HttpMethods.Put,
        HttpMethods.Patch,
        HttpMethods.Delete
    };

    private readonly RequestDelegate _next;
    private readonly IServiceScopeFactory _scopeFactory;

    public AuditMiddleware(RequestDelegate next, IServiceScopeFactory scopeFactory)
    {
        _next = next;
        _scopeFactory = scopeFactory;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        await _next(ctx);

        if (!_auditedMethods.Contains(ctx.Request.Method))
            return;

        // Ghi log sau khi response đã gửi để không block request pipeline
        var actorId = ctx.User.FindFirstValue("sub");
        var action = BuildAction(ctx);
        var ip = GetClientIp(ctx);

        // Fire-and-forget vì không muốn fail request nếu audit gặp lỗi
        _ = SafeLogAsync(_scopeFactory, actorId, action, ip);
    }

    private static string BuildAction(HttpContext ctx)
    {
        var method = ctx.Request.Method.ToUpperInvariant();
        var path = ctx.Request.Path.Value ?? "/";
        var status = ctx.Response.StatusCode;
        return $"{method} {path} -> {status}";
    }

    private static string? GetClientIp(HttpContext ctx)
    {
        // Ưu tiên X-Forwarded-For (khi đứng sau reverse proxy)
        var forwarded = ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
            return forwarded.Split(',')[0].Trim();

        return ctx.Connection.RemoteIpAddress?.ToString();
    }

    private static async Task SafeLogAsync(IServiceScopeFactory scopeFactory, string? actorId, string action, string? ip)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var auditLog = scope.ServiceProvider.GetRequiredService<IAuditLogService>();
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            await auditLog.LogAsync(actorId, action, ip, cts.Token);
        }
        catch
        {
            // Audit failure KHÔNG được làm crash ứng dụng
            // Nên ghi vào structured logger ở production, bỏ qua ở đây để tránh vòng lặp
        }
    }
}
