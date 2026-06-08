using LMS.Domain.Entities;

namespace LMS.Domain.Interfaces;

/// <summary>
/// Contract cho dịch vụ tạo Access Token (JWT RS256) và Refresh Token.
/// </summary>
public interface ITokenService
{
    /// <summary>Tạo Access Token JWT RS256, hết hạn sau 15 phút.</summary>
    string GenerateAccessToken(User user);

    /// <summary>Tạo Refresh Token dạng UUID ngẫu nhiên, hết hạn sau 7 ngày.</summary>
    (string Token, DateTime ExpiresAt) GenerateRefreshToken();
}
