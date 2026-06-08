using System.Security.Cryptography;
using System.Text;
using LMS.Domain.Interfaces;
using Microsoft.Extensions.Options;

namespace LMS.Infrastructure.Storage;

/// <summary>
/// Triển khai Signed URL cho video bài giảng dùng HMAC-SHA256.
///
/// Cấu trúc chữ ký (payload trước khi hash):
///   "{videoPath}:{userId}:{expires}"
///
/// Cấu trúc URL trả về:
///   {BaseStreamUrl}/{videoPath}?userId={userId}&amp;expires={unix}&amp;sig={base64url}
///
/// Bảo vệ:
/// - Chữ ký bind cả userId → không thể chia sẻ URL giữa các user.
/// - expires là Unix timestamp → server không tin đồng hồ client.
/// - Constant-time compare → chống timing attack.
/// </summary>
public sealed class HmacVideoSigningService : IVideoSigningService
{
    private readonly VideoSigningOptions _opts;
    private readonly byte[] _secretKey;

    public HmacVideoSigningService(IOptions<VideoSigningOptions> opts)
    {
        _opts = opts.Value;

        // Parse và validate secret key một lần lúc khởi tạo
        _secretKey = Convert.FromBase64String(_opts.SecretKeyBase64);
        if (_secretKey.Length < 32)
            throw new InvalidOperationException(
                "VideoSigning:SecretKeyBase64 phải có độ dài tối thiểu 32 byte (256-bit).");
    }

    /// <inheritdoc />
    public string GenerateSignedUrl(string videoPath, Guid userId, TimeSpan? ttl = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(videoPath);

        var effectiveTtl = ttl ?? TimeSpan.FromHours(_opts.DefaultTtlHours);

        // Server-side Unix timestamp – không phụ thuộc client
        var expires = DateTimeOffset.UtcNow.Add(effectiveTtl).ToUnixTimeSeconds();

        var signature = ComputeSignature(videoPath, userId, expires);

        // URL-safe Base64 cho signature
        var sigEncoded = Uri.EscapeDataString(signature);
        var pathEncoded = Uri.EscapeDataString(videoPath);

        return $"{_opts.BaseStreamUrl.TrimEnd('/')}/{pathEncoded}" +
               $"?userId={userId:N}&expires={expires}&sig={sigEncoded}";
    }

    /// <inheritdoc />
    public bool ValidateSignedUrl(string videoPath, Guid userId, long expires, string signature)
    {
        // 1. Kiểm tra thời hạn trước để fail fast (tránh tính HMAC không cần thiết)
        if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expires)
            return false;

        // 2. Tính lại chữ ký và so sánh constant-time
        var expected = ComputeSignature(videoPath, userId, expires);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected),
            Encoding.UTF8.GetBytes(signature));
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /// <summary>
    /// Tính HMAC-SHA256 của payload "{videoPath}:{userId}:{expires}" rồi
    /// trả về Base64 thường (không URL-encode ở đây – caller tự encode khi cần).
    /// </summary>
    private string ComputeSignature(string videoPath, Guid userId, long expires)
    {
        // Payload cố định: dùng "N" format (không dấu gạch) để nhất quán
        var payload = $"{videoPath}:{userId:N}:{expires}";
        var payloadBytes = Encoding.UTF8.GetBytes(payload);

        using var hmac = new HMACSHA256(_secretKey);
        var hash = hmac.ComputeHash(payloadBytes);
        return Convert.ToBase64String(hash);
    }
}
