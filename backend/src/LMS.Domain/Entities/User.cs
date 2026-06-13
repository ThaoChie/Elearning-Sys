namespace LMS.Domain.Entities;

/// <summary>
/// Vai trò người dùng trong hệ thống LMS.
/// Dùng cho RBAC (Role-Based Access Control) và được nhúng vào JWT claim "role".
/// </summary>
public enum UserRole
{
    Student    = 0,
    Instructor = 1,
    Admin      = 2
}

/// <summary>
/// Thực thể người dùng – chứa thông tin xác thực cốt lõi.
/// PasswordHash được lưu dưới dạng Argon2id hash (không bao giờ lưu plaintext).
/// LockoutEnd != null nghĩa là tài khoản đang bị khoá tạm thời.
/// Role xác định quyền truy cập (Student / Instructor / Admin).
/// </summary>
public class User
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;

    /// <summary>Vai trò của người dùng – nguồn chân lý cho RBAC.</summary>
    public UserRole Role { get; private set; } = UserRole.Student;

    /// <summary>Số lần đăng nhập sai liên tiếp chưa bị khoá.</summary>
    public int FailedLoginCount { get; private set; }

    /// <summary>Thời điểm hết hạn khoá tài khoản (null = không bị khoá).</summary>
    public DateTime? LockoutEnd { get; private set; }

    /// <summary>Refresh token hiện hành (UUID). null = chưa đăng nhập.</summary>
    public string? RefreshToken { get; private set; }

    /// <summary>Thời điểm hết hạn của Refresh Token.</summary>
    public DateTime? RefreshTokenExpiresAt { get; private set; }

    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// Trạng thái 2FA (optional). false = tắt (mặc định). true = bật.
    /// Người dùng tự bật/tắt trong mục "Cài đặt bảo mật" của Profile.
    /// KHÔNG ảnh hưởng đến luồng login cơ bản.
    /// </summary>
    public bool TwoFactorEnabled { get; private set; } = false;

    /// <summary>
    /// Khóa bí mật dùng cho Google Authenticator (TOTP).
    /// </summary>
    public string? TwoFactorSecret { get; private set; }

    // EF Core cần constructor không tham số (private để tránh dùng ngoài)
    private User() { }

    public static User Create(string email, string passwordHash, UserRole role = UserRole.Student)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

        return new User
        {
            Id               = Guid.NewGuid(),
            Email            = email.Trim().ToLowerInvariant(),
            PasswordHash     = passwordHash,
            Role             = role,
            FailedLoginCount = 0,
            CreatedAt        = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Thay đổi vai trò người dùng. Chỉ Admin mới được phép gọi (kiểm tra ở Application layer).
    /// Mọi thay đổi Role PHẢI được ghi vào Audit Log.
    /// </summary>
    public void ChangeRole(UserRole newRole)
    {
        Role = newRole;
    }

    // ── Domain behaviours ────────────────────────────────────────────────────

    /// <summary>Ghi nhận đăng nhập thành công: reset bộ đếm lỗi.</summary>
    public void RecordSuccessfulLogin()
    {
        FailedLoginCount = 0;
        LockoutEnd = null;
    }

    /// <summary>
    /// Ghi nhận một lần đăng nhập sai.
    /// Nếu đạt ngưỡng 5 lần → khoá 15 phút.
    /// </summary>
    public void RecordFailedLogin()
    {
        FailedLoginCount++;
        if (FailedLoginCount >= 5)
        {
            LockoutEnd = DateTime.UtcNow.AddMinutes(15);
        }
    }

    /// <summary>Kiểm tra tài khoản có đang bị khoá không.</summary>
    public bool IsLockedOut() =>
        LockoutEnd.HasValue && LockoutEnd.Value > DateTime.UtcNow;

    /// <summary>Cập nhật mật khẩu mới (đã được băm).</summary>
    public void UpdatePassword(string newPasswordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(newPasswordHash);
        PasswordHash = newPasswordHash;
    }

    /// <summary>Lưu Refresh Token mới sau khi issue thành công.</summary>
    public void SetRefreshToken(string token, DateTime expiresAt)
    {
        RefreshToken = token;
        RefreshTokenExpiresAt = expiresAt;
    }

    /// <summary>
    /// Bật hoặc tắt 2FA cho tài khoản này.
    /// Chỉ được gọi từ Application layer sau khi xác thực quyền sở hữu.
    /// </summary>
    public void SetTwoFactor(bool isEnabled)
    {
        TwoFactorEnabled = isEnabled;
    }

    /// <summary>
    /// Thiết lập Secret Key cho TOTP (Google Authenticator).
    /// </summary>
    public void SetTwoFactorSecret(string secret)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(secret);
        TwoFactorSecret = secret;
    }

    /// <summary>
    /// Tắt hoàn toàn 2FA, xóa secret key.
    /// </summary>
    public void DisableTwoFactor()
    {
        TwoFactorEnabled = false;
        TwoFactorSecret = null;
    }

    /// <summary>Thu hồi Refresh Token (đăng xuất).</summary>
    public void RevokeRefreshToken()
    {
        RefreshToken = null;
        RefreshTokenExpiresAt = null;
    }

    /// <summary>Kiểm tra Refresh Token có hợp lệ không.</summary>
    public bool IsRefreshTokenValid(string token) =>
        RefreshToken == token &&
        RefreshTokenExpiresAt.HasValue &&
        RefreshTokenExpiresAt.Value > DateTime.UtcNow;
}
