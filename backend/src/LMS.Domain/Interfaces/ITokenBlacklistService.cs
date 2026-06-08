namespace LMS.Domain.Interfaces;

/// <summary>
/// Quản lý Redis Blacklist cho Access Token (JTI) và Revoke toàn bộ Refresh Token theo UserID.
/// </summary>
public interface ITokenBlacklistService
{
    /// <summary>
    /// Đưa JTI của Access Token vào Blacklist với TTL = thời gian sống còn lại của token.
    /// Middleware sẽ từ chối mọi request mang JTI này.
    /// </summary>
    Task BlacklistAccessTokenAsync(string jti, TimeSpan ttl, CancellationToken ct = default);

    /// <summary>
    /// Kiểm tra JTI có nằm trong Blacklist không.
    /// </summary>
    Task<bool> IsBlacklistedAsync(string jti, CancellationToken ct = default);

    /// <summary>
    /// Đánh dấu UserID bị revoke toàn bộ (dùng khi phát hiện Refresh Token reuse).
    /// Access Token của user này sẽ bị từ chối cho đến khi cờ hết hạn.
    /// TTL = 8 ngày (> Refresh Token 7 ngày) để đảm bảo phủ hết.
    /// </summary>
    Task RevokeAllUserTokensAsync(Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Kiểm tra UserID có bị revoke toàn bộ không.
    /// </summary>
    Task<bool> IsUserRevokedAsync(Guid userId, CancellationToken ct = default);
}
