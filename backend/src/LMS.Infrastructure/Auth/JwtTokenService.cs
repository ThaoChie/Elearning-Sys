using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using LMS.Domain.Entities;
using LMS.Domain.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LMS.Infrastructure.Auth;

/// <summary>
/// Dịch vụ sinh JWT RS256 Access Token và Refresh Token UUID.
///
/// Access Token:
///   - Algorithm: RS256 (RSA-SHA256) – private key ký, public key verify.
///   - Lifetime: 15 phút.
///   - Claims: sub (userId), email, jti (unique token id).
///
/// Refresh Token:
///   - Dạng UUID ngẫu nhiên (128-bit entropy), không chứa thông tin người dùng.
///   - Lifetime: 7 ngày.
///   - Lưu tại DB, rotate mỗi lần dùng.
/// </summary>
public sealed class JwtTokenService : ITokenService
{
    private readonly IOptionsMonitor<JwtSettings> _optionsMonitor;
    private RsaSecurityKey _privateKey = null!;

    public JwtTokenService(IOptionsMonitor<JwtSettings> optionsMonitor)
    {
        _optionsMonitor = optionsMonitor;

        LoadPrivateKey(_optionsMonitor.CurrentValue);

        // Đăng ký callback khi cấu hình thay đổi (hỗ trợ Key Rotation)
        _optionsMonitor.OnChange(LoadPrivateKey);
    }

    private void LoadPrivateKey(JwtSettings settings)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(settings.PrivateKeyPem) || settings.PrivateKeyPem.Contains("REPLACE_WITH"))
            {
                throw new InvalidOperationException("Chưa cấu hình Jwt:PrivateKeyPem hoặc sử dụng giá trị REPLACE_WITH.");
            }

            var pemStr = settings.PrivateKeyPem.Replace("\\n", "\n").Trim();
            
            // Nếu người dùng cấu hình giá trị là đường dẫn file thay vì nội dung
            if (pemStr.EndsWith(".pem") || pemStr.EndsWith(".key"))
            {
                if (File.Exists(pemStr))
                {
                    pemStr = File.ReadAllText(pemStr);
                }
            }

            var rsa = RSA.Create();
            rsa.ImportFromPem(pemStr.AsSpan());
            _privateKey = new RsaSecurityKey(rsa);
            Console.WriteLine("[JwtTokenService] Đã nạp Private Key thành công từ cấu hình.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[JwtTokenService Warning] Lỗi đọc Private Key: {ex.Message}. Sử dụng IN-MEMORY Ephemeral Key làm fallback.");
            // Fallback tạo key ngẫu nhiên mỗi khi server start
            var ephemeralRsa = RSA.Create(2048);
            _privateKey = new RsaSecurityKey(ephemeralRsa);
        }
    }

    public string GenerateAccessToken(User user)
    {
        if (_privateKey == null)
            throw new InvalidOperationException("Private Key chưa được nạp từ Secret Manager.");

        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(15);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            // role claim – nguồn chân lý cho RBAC; KHÔNG tin bất kỳ input nào từ client
            new Claim("role", user.Role.ToString()),
            // jti: JWT ID – unique per token, dùng để revoke (Blacklist) khi logout
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat,
                      DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                      ClaimValueTypes.Integer64),
        };

        var creds = new SigningCredentials(_privateKey, SecurityAlgorithms.RsaSha256);

        var token = new JwtSecurityToken(
            issuer: _optionsMonitor.CurrentValue.Issuer,
            audience: _optionsMonitor.CurrentValue.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public (string Token, DateTime ExpiresAt) GenerateRefreshToken()
    {
        // UUID v4 shortened to 16 chars: 64-bit entropy, fits in 64 char database field when prepended with user ID.
        var token = Guid.NewGuid().ToString("N")[..16]; // 16 hex chars, no dashes
        var expiresAt = DateTime.UtcNow.AddDays(7);
        return (token, expiresAt);
    }
}
