using LMS.Application.Features.Auth.DTOs;
using LMS.Domain.Exceptions;
using LMS.Domain.Interfaces;
using MediatR;

namespace LMS.Application.Features.Auth.Commands;

/// <summary>
/// Handler xử lý LoginCommand theo pipeline CQRS.
///
/// Luồng bảo mật:
/// 1. Tra cứu User bằng email (normalize → chống phân biệt hoa/thường).
/// 2. Kiểm tra khoá tài khoản (AccountLockedException) trước khi verify hash.
/// 3. Verify mật khẩu bằng constant-time compare (Argon2id).
///    - Sai → RecordFailedLogin(), có thể gây khoá → ném InvalidCredentialsException.
///    - Đúng → RecordSuccessfulLogin(), issue token.
/// 4. Sinh Access Token (JWT RS256, 15 phút) + Refresh Token (UUID, 7 ngày).
/// 5. Persist Refresh Token vào DB (cơ chế Rotation: mỗi lần login tạo token mới).
/// </summary>
public sealed class LoginCommandHandler(
    IUserRepository userRepository,
    ITokenService tokenService,
    IPasswordHasher passwordHasher)
    : IRequestHandler<LoginCommand, LoginResponse>
{
    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken ct)
    {
        // Normalize email để chống phân biệt hoa thường
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await userRepository.GetByEmailAsync(normalizedEmail, ct);

        // ── Kiểm tra khoá tài khoản ──────────────────────────────────────────
        // Thực hiện TRƯỚC khi verify hash để tránh lãng phí CPU Argon2id
        // khi tài khoản đang bị khoá.
        if (user is not null && user.IsLockedOut())
        {
            throw new AccountLockedException(user.LockoutEnd!.Value);
        }

        // ── Verify mật khẩu (constant-time) ─────────────────────────────────
        // Dùng cùng đường code kể cả khi user == null để chống timing attack.
        // passwordHasher.Verify() tự dùng CryptographicOperations.FixedTimeEquals.
        var passwordValid = user is not null &&
                            passwordHasher.Verify(request.Password, user.PasswordHash);

        if (!passwordValid)
        {
            // Chỉ ghi nhận thất bại khi user tồn tại (tránh tạo record giả)
            if (user is not null)
            {
                user.RecordFailedLogin();
                await userRepository.SaveChangesAsync(ct);
            }

            // Message chung chung để chống User Enumeration Attack
            throw new InvalidCredentialsException();
        }

        // ── Đăng nhập thành công ─────────────────────────────────────────────
        user!.RecordSuccessfulLogin();

        var accessToken = tokenService.GenerateAccessToken(user);
        var (refreshToken, refreshExpiresAt) = tokenService.GenerateRefreshToken();

        // Rotation: ghi đè Refresh Token cũ bằng token mới (single-use model)
        user.SetRefreshToken(refreshToken, refreshExpiresAt);
        await userRepository.SaveChangesAsync(ct);

        return new LoginResponse(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            AccessTokenExpiresAt: DateTime.UtcNow.AddMinutes(15),
            RefreshTokenExpiresAt: refreshExpiresAt,
            UserId: user.Id,
            Email: user.Email
        );
    }
}
