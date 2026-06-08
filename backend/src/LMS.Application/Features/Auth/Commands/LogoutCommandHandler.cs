using LMS.Domain.Interfaces;
using MediatR;

namespace LMS.Application.Features.Auth.Commands;

/// <summary>
/// Handler cho LogoutCommand.
///
/// Luồng bảo mật:
/// 1. Tính TTL còn lại của Access Token (= ExpiresAt - UtcNow).
/// 2. Đẩy JTI vào Redis Blacklist với TTL chính xác đó.
///    → Middleware sẽ từ chối token này cho đến khi nó tự hết hạn.
/// 3. Revoke Refresh Token trong DB (user.RevokeRefreshToken).
///    → Chặn mọi attempt refresh sau khi logout.
/// </summary>
public sealed class LogoutCommandHandler(
    IUserRepository userRepository,
    ITokenBlacklistService blacklist)
    : IRequestHandler<LogoutCommand>
{
    public async Task Handle(LogoutCommand request, CancellationToken ct)
    {
        // ── 1. Blacklist Access Token (JTI) vào Redis ─────────────────────────
        var remaining = request.AccessTokenExpiry - DateTime.UtcNow;

        // TTL phải dương; nếu token sắp hết hạn vẫn blacklist để đảm bảo
        var ttl = remaining > TimeSpan.Zero ? remaining : TimeSpan.FromSeconds(1);
        await blacklist.BlacklistAccessTokenAsync(request.Jti, ttl, ct);

        // ── 2. Revoke Refresh Token trong DB ──────────────────────────────────
        var user = await userRepository.GetByIdAsync(request.UserId, ct);
        if (user is not null)
        {
            user.RevokeRefreshToken();
            await userRepository.SaveChangesAsync(ct);
        }
    }
}
