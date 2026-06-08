using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using LMS.Domain.Interfaces;

namespace LMS.API.Middlewares;

/// <summary>
/// Middleware kiểm tra Redis Blacklist sau khi JWT đã được validate bởi ASP.NET Core JwtBearer.
///
/// Thứ tự trong pipeline (xem Program.cs):
///   UseAuthentication()  → ASP.NET Core validate chữ ký + lifetime của JWT
///   UseMiddleware[JwtBlacklistMiddleware]()  → kiểm tra JTI trong Redis Blacklist
///   UseAuthorization()   → kiểm tra Policy/Role
///
/// Block request nếu:
///   1. JTI của Access Token nằm trong Redis Blacklist (user đã logout).
///   2. UserID của token nằm trong danh sách bị revoke toàn bộ
///      (reuse attack detected → toàn bộ session bị thu hồi).
/// </summary>
public sealed class JwtBlacklistMiddleware
{
    private readonly RequestDelegate _next;

    public JwtBlacklistMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext ctx, ITokenBlacklistService blacklist)
    {
        // Chỉ kiểm tra khi request đã được authenticate (có Identity)
        if (ctx.User.Identity?.IsAuthenticated == true)
        {
            var jti    = ctx.User.FindFirstValue(JwtRegisteredClaimNames.Jti);
            var subStr = ctx.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                      ?? ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!string.IsNullOrEmpty(jti))
            {
                // ── Kiểm tra JTI Blacklist ────────────────────────────────────
                if (await blacklist.IsBlacklistedAsync(jti, ctx.RequestAborted))
                {
                    ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await ctx.Response.WriteAsJsonAsync(new
                    {
                        error   = "token_revoked",
                        message = "Token đã bị thu hồi. Vui lòng đăng nhập lại."
                    }, ctx.RequestAborted);
                    return;
                }
            }

            // ── Kiểm tra User bị revoke toàn bộ ─────────────────────────────
            if (!string.IsNullOrEmpty(subStr) && Guid.TryParse(subStr, out var userId))
            {
                if (await blacklist.IsUserRevokedAsync(userId, ctx.RequestAborted))
                {
                    ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await ctx.Response.WriteAsJsonAsync(new
                    {
                        error   = "session_revoked",
                        message = "Phiên đăng nhập đã bị thu hồi do phát hiện hoạt động bất thường. Vui lòng đăng nhập lại."
                    }, ctx.RequestAborted);
                    return;
                }
            }
        }

        await _next(ctx);
    }
}
