namespace LMS.Infrastructure.Security;

/// <summary>
/// Cấu hình dịch vụ bảo mật file.
/// Bind từ appsettings section "FileSecurity".
/// </summary>
public sealed class FileSecurityOptions
{
    public const string SectionName = "FileSecurity";

    /// <summary>
    /// Khoá AES-256 (32 byte) dưới dạng Base64.
    /// PHẢI được đặt trong Secret Manager / env var ở production.
    /// </summary>
    public string AesKeyBase64 { get; init; } = string.Empty;

    /// <summary>Host của ClamAV daemon (mặc định: localhost).</summary>
    public string ClamAvHost   { get; init; } = "localhost";

    /// <summary>Port của ClamAV daemon (mặc định: 3310).</summary>
    public int    ClamAvPort   { get; init; } = 3310;

    /// <summary>Timeout kết nối tới ClamAV (giây, mặc định: 30).</summary>
    public int    ClamAvTimeoutSeconds { get; init; } = 30;
}
