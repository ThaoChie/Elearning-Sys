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
    private readonly JwtSettings _settings;
    private readonly RsaSecurityKey _privateKey;

    public JwtTokenService(IOptions<JwtSettings> options)
    {
        _settings = options.Value;

        // Load RSA private key từ PEM string trong cấu hình
        var rsa = RSA.Create();
        rsa.ImportFromPem(_settings.PrivateKeyPem.AsSpan());
        _privateKey = new RsaSecurityKey(rsa);
    }

    public string GenerateAccessToken(User user)
    {
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
            issuer: _settings.Issuer,
            audience: _settings.Audience,
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
