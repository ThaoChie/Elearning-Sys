namespace LMS.Infrastructure.Auth;

/// <summary>
/// Cấu hình JWT được bind từ appsettings.json section "Jwt".
/// PrivateKeyPem: RSA private key dạng PEM (chỉ dùng server-side để ký token).
/// PublicKeyPem: RSA public key dạng PEM (dùng để validate token).
/// </summary>
public sealed class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;

    /// <summary>RSA-2048 Private Key PEM – CẦN BẢO MẬT, đặt trong Secret Manager / env var.</summary>
    public string PrivateKeyPem { get; set; } = string.Empty;

    /// <summary>RSA-2048 Public Key PEM – dùng để middleware validate JWT.</summary>
    public string PublicKeyPem { get; set; } = string.Empty;
}
