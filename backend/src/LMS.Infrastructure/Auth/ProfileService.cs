using LMS.Domain.Exceptions;
using LMS.Domain.Interfaces;
using OtpNet;

namespace LMS.Infrastructure.Auth;

/// <summary>
/// Xử lý các thao tác cài đặt bảo mật trong Profile người dùng.
/// 2FA là tùy chọn (optional) — người dùng tự bật/tắt.
/// </summary>
public sealed class ProfileService(IUserRepository userRepository, IPasswordHasher passwordHasher) : IProfileService
{
    /// <inheritdoc/>
    public async Task<(string Secret, string QrCodeUri)> GenerateTwoFactorSetupAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await userRepository.GetByIdAsync(userId, ct)
            ?? throw new UserNotFoundException(userId);

        // Sinh secret key mới nếu chưa có
        var secretKey = KeyGeneration.GenerateRandomKey(20);
        var secretString = Base32Encoding.ToString(secretKey);

        user.SetTwoFactorSecret(secretString);
        await userRepository.SaveChangesAsync(ct);

        // Tạo URI cho QR Code
        var uri = $"otpauth://totp/Elearning:{user.Email}?secret={secretString}&issuer=Elearning";
        return (secretString, uri);
    }

    /// <inheritdoc/>
    public async Task<bool> VerifyAndEnableTwoFactorAsync(Guid userId, string code, CancellationToken ct = default)
    {
        var user = await userRepository.GetByIdAsync(userId, ct)
            ?? throw new UserNotFoundException(userId);

        if (string.IsNullOrEmpty(user.TwoFactorSecret))
            return false;

        var secretBytes = Base32Encoding.ToBytes(user.TwoFactorSecret);
        var totp = new Totp(secretBytes);
        
        bool isValid = totp.VerifyTotp(code, out _, new VerificationWindow(1, 1));
        if (isValid)
        {
            user.SetTwoFactor(true);
            await userRepository.SaveChangesAsync(ct);
        }

        return isValid;
    }

    /// <inheritdoc/>
    public async Task DisableTwoFactorAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await userRepository.GetByIdAsync(userId, ct)
            ?? throw new UserNotFoundException(userId);

        user.DisableTwoFactor();
        await userRepository.SaveChangesAsync(ct);
    }

    /// <inheritdoc/>
    public async Task<bool> GetTwoFactorStatusAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await userRepository.GetByIdAsync(userId, ct)
            ?? throw new UserNotFoundException(userId);

        return user.TwoFactorEnabled;
    }

    /// <inheritdoc/>
    public async Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken ct = default)
    {
        if (currentPassword == newPassword)
        {
            throw new ArgumentException("Mật khẩu mới phải khác mật khẩu cũ.");
        }

        var user = await userRepository.GetByIdAsync(userId, ct)
            ?? throw new UserNotFoundException(userId);

        if (!passwordHasher.Verify(currentPassword, user.PasswordHash))
        {
            throw new InvalidCredentialsException();
        }

        var newHash = passwordHasher.Hash(newPassword);
        user.UpdatePassword(newHash);

        await userRepository.SaveChangesAsync(ct);
    }
}
