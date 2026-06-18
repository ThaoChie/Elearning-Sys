namespace LMS.Application.Features.Auth.DTOs;

/// <summary>
/// Dữ liệu trả về sau khi đăng nhập thành công (không cần MFA).
/// </summary>
public sealed record LoginResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt,
    DateTime RefreshTokenExpiresAt,
    Guid UserId,
    string Email,
    /// <summary>
    /// true = cần bước xác thực MFA. Khi đó AccessToken là token tạm (MFA pending).
    /// false = đăng nhập hoàn tất, AccessToken là token chính thức.
    /// </summary>
    bool RequiresMfa = false
);
