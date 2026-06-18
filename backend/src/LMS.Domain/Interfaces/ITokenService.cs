using LMS.Domain.Entities;

namespace LMS.Domain.Interfaces;

/// <summary>
/// Contract cho dịch vụ tạo Access Token (JWT RS256) và Refresh Token.
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Tạo Access Token JWT RS256.
    /// </summary>
    /// <param name="user">User cần tạo token.</param>
    /// <param name="mfaPending">
    /// true = token tạm trong luồng MFA (chứa claim "mfa_pending=true", hết hạn 5 phút).
    /// false (mặc định) = token chính thức, hết hạn 15 phút.
    /// </param>
    string GenerateAccessToken(User user, bool mfaPending = false);

    /// <summary>Tạo Refresh Token dạng UUID ngẫu nhiên, hết hạn sau 7 ngày.</summary>
    (string Token, DateTime ExpiresAt) GenerateRefreshToken();
}
