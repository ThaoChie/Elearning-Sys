using System.IdentityModel.Tokens.Jwt;

namespace LMS.API.Middlewares;

/// <summary>
/// Middleware bảo vệ chống lạm dụng MFA Pending Token.
///
/// Vấn đề cần giải quyết:
///   Khi user có 2FA bật, login trả về một Access Token tạm chứa claim "mfa_pending=true".
///   Token này có đủ claims (sub, role) để pass qua [Authorize] thông thường.
///   Nếu không có middleware này, frontend có thể dùng token tạm để gọi bất kỳ API nào —
///   bỏ qua hoàn toàn bước xác thực OTP.
///
/// Giải pháp:
///   - Middleware này chạy SAU UseAuthentication() và TRƯỚC UseAuthorization().
///   - Đọc raw JWT từ Authorization header để tránh vấn đề claim mapping của ASP.NET Core.
///   - Nếu token chứa "mfa_pending=true", chỉ cho phép:
///       POST /api/auth/verify-mfa
///   - Tất cả endpoints khác → 403 Forbidden.
/// </summary>
public sealed class MfaPendingMiddleware
{
    private readonly RequestDelegate _next;

    private static readonly (string Method, string Path)[] AllowedEndpoints =
    [
        ("POST", "/api/auth/verify-mfa"),
    ];

    public MfaPendingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        if (ctx.User.Identity?.IsAuthenticated == true)
        {
            // 1. Thử đọc từ ClaimsPrincipal (sau JWT handler)
            var mfaPendingFromClaims = ctx.User.FindFirst("mfa_pending")?.Value;

            // 2. Fallback: đọc trực tiếp từ raw JWT token trong Authorization header
            //    Cần thiết vì ASP.NET Core JWT handler có thể bỏ qua custom claim names
            //    không nằm trong WellKnownClaims list.
            string? mfaPendingRaw = null;
            var authHeader = ctx.Request.Headers["Authorization"].FirstOrDefault();
            if (authHeader?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true)
            {
                var rawJwt = authHeader["Bearer ".Length..].Trim();
                try
                {
                    var jwtHandler = new JwtSecurityTokenHandler();
                    if (jwtHandler.CanReadToken(rawJwt))
                    {
                        var jwtToken = jwtHandler.ReadJwtToken(rawJwt);
                        mfaPendingRaw = jwtToken.Claims
                            .FirstOrDefault(c => c.Type == "mfa_pending")?.Value;
                    }
                }
                catch
                {
                    // Ignore parse errors — invalid token sẽ bị xử lý ở UseAuthentication
                }
            }

            var isMfaPending = (mfaPendingFromClaims ?? mfaPendingRaw) == "true";

            if (isMfaPending)
            {
                var method = ctx.Request.Method.ToUpperInvariant();
                var path   = ctx.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;

                bool isAllowed = AllowedEndpoints.Any(e =>
                    e.Method.Equals(method, StringComparison.OrdinalIgnoreCase) &&
                    path.Equals(e.Path, StringComparison.OrdinalIgnoreCase));

                if (!isAllowed)
                {
                    ctx.Response.StatusCode  = StatusCodes.Status403Forbidden;
                    ctx.Response.ContentType = "application/json";
                    await ctx.Response.WriteAsJsonAsync(new
                    {
                        error   = "mfa_required",
                        message = "Token chưa hoàn thành xác thực 2 yếu tố. " +
                                  "Vui lòng gọi POST /api/auth/verify-mfa để hoàn tất đăng nhập."
                    }, ctx.RequestAborted);
                    return;
                }
            }
        }

        await _next(ctx);
    }
}

