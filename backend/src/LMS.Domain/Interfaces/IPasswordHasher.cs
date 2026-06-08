namespace LMS.Domain.Interfaces;

/// <summary>
/// Contract cho password hashing/verification.
/// Implementation dùng Argon2id với constant-time compare.
/// </summary>
public interface IPasswordHasher
{
    /// <summary>Hash mật khẩu bằng Argon2id. Trả về chuỗi encoded chứa salt + params.</summary>
    string Hash(string password);

    /// <summary>
    /// Verify mật khẩu với constant-time compare để chống timing attack.
    /// Luôn thực thi đủ bước dù mật khẩu sai từ ký tự đầu.
    /// </summary>
    bool Verify(string password, string hash);
}
