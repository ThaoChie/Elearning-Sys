namespace LMS.Domain.Interfaces;

public interface IProfileService
{
    /// <summary>
    /// Sinh mã bí mật và URI cho Google Authenticator. 
    /// Chưa bật 2FA ngay, cần gọi VerifyAndEnableTwoFactorAsync để xác nhận.
    /// </summary>
    Task<(string Secret, string QrCodeUri)> GenerateTwoFactorSetupAsync(Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Xác thực mã 6 số từ Google Authenticator và bật 2FA nếu đúng.
    /// </summary>
    Task<bool> VerifyAndEnableTwoFactorAsync(Guid userId, string code, CancellationToken ct = default);

    /// <summary>
    /// Tắt hoàn toàn 2FA cho người dùng.
    /// </summary>
    Task DisableTwoFactorAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Trả về trạng thái 2FA hiện tại của người dùng.</summary>
    Task<bool> GetTwoFactorStatusAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Thay đổi mật khẩu người dùng.</summary>
    Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken ct = default);
}
