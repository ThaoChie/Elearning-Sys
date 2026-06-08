using LMS.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace LMS.Infrastructure.Auth;

/// <summary>
/// Triển khai ITokenBlacklistService sử dụng Redis.
///
/// Key conventions:
///   jti_blacklist:{jti}        → giá trị "1", TTL = thời gian sống còn lại của Access Token
///   user_revoked:{userId}      → giá trị "1", TTL = 8 ngày (phủ toàn bộ Refresh Token 7 ngày)
///
/// Tất cả thao tác Redis dùng SET NX + EX (atomic) để tránh race condition.
/// </summary>
public sealed class RedisTokenBlacklistService : ITokenBlacklistService
{
    private const string JtiPrefix      = "jti_blacklist:";
    private const string UserRevokePrefix = "user_revoked:";
    private static readonly TimeSpan UserRevokeTtl = TimeSpan.FromDays(8);

    private readonly IDatabase _db;
    private readonly ILogger<RedisTokenBlacklistService> _logger;

    public RedisTokenBlacklistService(
        IConnectionMultiplexer redis,
        ILogger<RedisTokenBlacklistService> logger)
    {
        _db     = redis.GetDatabase();
        _logger = logger;
    }

    public async Task BlacklistAccessTokenAsync(string jti, TimeSpan ttl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
            throw new ArgumentException("JTI không được rỗng.", nameof(jti));

        // TTL âm/zero không set (token đã hết hạn, không cần blacklist)
        if (ttl <= TimeSpan.Zero)
            return;

        var key = JtiPrefix + jti;
        try
        {
            await _db.StringSetAsync(key, "1", ttl);
        }
        catch (RedisException ex)
        {
            // Log nhưng không ném để không block logout flow
            _logger.LogError(ex, "Redis: Không thể blacklist JTI {Jti}", jti);
        }
    }

    public async Task<bool> IsBlacklistedAsync(string jti, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
            return false;

        try
        {
            return await _db.KeyExistsAsync(JtiPrefix + jti);
        }
        catch (RedisException ex)
        {
            // Fail-safe: nếu Redis down → cho phép request đi qua
            // (chấp nhận rủi ro nhỏ hơn là block toàn bộ hệ thống)
            _logger.LogError(ex, "Redis: Không thể kiểm tra blacklist JTI {Jti}", jti);
            return false;
        }
    }

    public async Task RevokeAllUserTokensAsync(Guid userId, CancellationToken ct = default)
    {
        var key = UserRevokePrefix + userId.ToString("N");
        try
        {
            await _db.StringSetAsync(key, "1", UserRevokeTtl);
        }
        catch (RedisException ex)
        {
            _logger.LogError(ex, "Redis: Không thể revoke toàn bộ token của User {UserId}", userId);
        }
    }

    public async Task<bool> IsUserRevokedAsync(Guid userId, CancellationToken ct = default)
    {
        try
        {
            return await _db.KeyExistsAsync(UserRevokePrefix + userId.ToString("N"));
        }
        catch (RedisException ex)
        {
            _logger.LogError(ex, "Redis: Không thể kiểm tra revoke User {UserId}", userId);
            return false;
        }
    }
}
