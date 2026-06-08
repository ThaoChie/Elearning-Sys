using System.Security.Claims;
using LMS.Domain.Interfaces;
using Microsoft.AspNetCore.Http;

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

    public AuditMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext ctx, IAuditLogService auditLog)
    {
        await _next(ctx);

        if (!_auditedMethods.Contains(ctx.Request.Method))
            return;

        // Ghi log sau khi response đã gửi để không block request pipeline
        var actorId = ctx.User.FindFirstValue("sub");
        var action = BuildAction(ctx);
        var ip = GetClientIp(ctx);

        // Fire-and-forget vì không muốn fail request nếu audit gặp lỗi
        _ = SafeLogAsync(auditLog, actorId, action, ip);
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

    private static async Task SafeLogAsync(IAuditLogService auditLog, string? actorId, string action, string? ip)
    {
        try
        {
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
