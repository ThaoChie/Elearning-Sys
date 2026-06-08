namespace LMS.Domain.Exceptions;

/// <summary>
/// Ném khi tài khoản đang bị khoá do nhập sai mật khẩu quá nhiều lần.
/// </summary>
public sealed class AccountLockedException(DateTime lockoutEnd)
    : Exception($"Tài khoản bị khoá đến {lockoutEnd:HH:mm:ss dd/MM/yyyy} UTC.")
{
    public DateTime LockoutEnd { get; } = lockoutEnd;
}

/// <summary>
/// Ném khi thông tin đăng nhập không hợp lệ (email không tồn tại hoặc sai mật khẩu).
/// Dùng message chung chung để tránh User Enumeration.
/// </summary>
public sealed class InvalidCredentialsException()
    : Exception("Email hoặc mật khẩu không đúng.");

/// <summary>
/// Ném khi Refresh Token không hợp lệ, đã hết hạn hoặc bị revoke.
/// </summary>
public sealed class InvalidTokenException(string message)
    : Exception(message);
