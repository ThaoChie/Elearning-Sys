using System.ComponentModel.DataAnnotations;

namespace LMS.Infrastructure.Storage;

/// <summary>
/// Cấu hình Signed URL được bind từ appsettings section "VideoSigning".
/// Secret phải đặt trong Secret Manager / env var ở production,
/// KHÔNG commit lên source control.
/// </summary>
public sealed class VideoSigningOptions
{
    public const string SectionName = "VideoSigning";

    /// <summary>
    /// Khoá bí mật HMAC-SHA256 – tối thiểu 32 byte khi decode từ Base64.
    /// Đặt trong Secret Manager: dotnet user-secrets set "VideoSigning:SecretKeyBase64" "..."
    /// </summary>
    [Required]
    public string SecretKeyBase64 { get; set; } = string.Empty;

    /// <summary>
    /// Base URL nội bộ của media server / MinIO / proxy endpoint.
    /// VD: "https://media.lms.local/stream"
    /// </summary>
    [Required]
    public string BaseStreamUrl { get; set; } = string.Empty;

    /// <summary>
    /// Thời gian sống mặc định của Signed URL tính bằng giờ. Mặc định 4 giờ.
    /// </summary>
    [Range(1, 24)]
    public int DefaultTtlHours { get; set; } = 4;
}
