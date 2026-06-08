using LMS.Application.Features.Auth.DTOs;
using LMS.Domain.Exceptions;
using LMS.Domain.Interfaces;
using MediatR;

namespace LMS.Application.Features.Auth.Commands;

/// <summary>
/// Handler cho RefreshTokenCommand.
///
/// Luồng bảo mật:
/// 1. Tra cứu User theo RefreshToken trong DB.
///    - Không tìm thấy → token giả mạo/đã bị revoke → từ chối (InvalidTokenException).
/// 2. *** REUSE DETECTION ***
///    Nếu User tồn tại nhưng RefreshToken trong DB KHÔNG khớp token được gửi:
///    → Token cũ đã bị rotate (đang bị dùng lại).
///    → Revoke toàn bộ session (DB + Redis) và ném SecurityException.
/// 3. Kiểm tra hạn của Refresh Token (IsRefreshTokenValid).
/// 4. Rotation: cấp Access Token MỚI + Refresh Token MỚI, lưu vào DB.
/// </summary>
public sealed class RefreshTokenCommandHandler(
    IUserRepository userRepository,
    ITokenService tokenService,
    ITokenBlacklistService blacklist)
    : IRequestHandler<RefreshTokenCommand, LoginResponse>
{
    public async Task<LoginResponse> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var incomingToken = request.RefreshToken?.Trim()
            ?? throw new InvalidTokenException("Refresh Token không được rỗng.");

        // ── 1. Tra cứu User theo token ────────────────────────────────────────
        var user = await userRepository.GetByRefreshTokenAsync(incomingToken, ct);

        if (user is null)
        {
            // ── REUSE DETECTION (User null path) ─────────────────────────────
            // Token không tìm thấy trong DB = đã bị rotate ra khỏi DB.
            // Không biết thuộc về ai → không thể revoke, chỉ từ chối.
            throw new InvalidTokenException("Refresh Token không hợp lệ hoặc đã hết hạn.");
        }

        // ── 2. Kiểm tra token có hợp lệ không (so sánh + expiry) ─────────────
        if (!user.IsRefreshTokenValid(incomingToken))
        {
            // Token hết hạn hoặc không khớp → revoke toàn bộ phòng ngừa replay
            user.RevokeRefreshToken();
            await userRepository.SaveChangesAsync(ct);
            await blacklist.RevokeAllUserTokensAsync(user.Id, ct);

            throw new InvalidTokenException("Refresh Token đã hết hạn. Vui lòng đăng nhập lại.");
        }

        // ── 3. Token hợp lệ → Rotation ───────────────────────────────────────
        var accessToken  = tokenService.GenerateAccessToken(user);
        var (newRefresh, newRefreshExpiry) = tokenService.GenerateRefreshToken();

        // Ghi đè Refresh Token cũ bằng token MỚI (single-use rotation)
        user.SetRefreshToken(newRefresh, newRefreshExpiry);
        await userRepository.SaveChangesAsync(ct);

        return new LoginResponse(
            AccessToken:           accessToken,
            RefreshToken:          newRefresh,
            AccessTokenExpiresAt:  DateTime.UtcNow.AddMinutes(15),
            RefreshTokenExpiresAt: newRefreshExpiry,
            UserId:                user.Id,
            Email:                 user.Email
        );
    }
}
