namespace LMS.Application.Features.Auth.DTOs;

/// <summary>Dữ liệu trả về sau khi đăng nhập thành công.</summary>
public sealed record LoginResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt,
    DateTime RefreshTokenExpiresAt,
    Guid UserId,
    string Email
);
