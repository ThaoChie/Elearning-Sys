using System.Security.Cryptography;
using Isopoh.Cryptography.Argon2;
using LMS.Domain.Interfaces;

namespace LMS.Infrastructure.Auth;

/// <summary>
/// Password hashing sử dụng Argon2id.
///
/// Tham số được chọn theo OWASP 2023 cho Argon2id:
///   - Memory: 64 MiB (đủ nặng để chống GPU brute-force)
///   - Iterations: 3
///   - Parallelism: 1
///
/// Verify dùng CryptographicOperations.FixedTimeEquals để chống timing attack.
/// </summary>
public sealed class Argon2idPasswordHasher : IPasswordHasher
{
    // OWASP-recommended params for Argon2id
    private const int MemoryCost = 65536;   // 64 MiB
    private const int TimeCost = 3;
    private const int Parallelism = 1;
    private const int HashLength = 32;      // 256-bit output

    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        // Argon2 library tự sinh salt ngẫu nhiên và encode toàn bộ thành chuỗi
        var config = new Argon2Config
        {
            Type = Argon2Type.DataIndependentAddressing, // Argon2id
            Version = Argon2Version.Nineteen,
            MemoryCost = MemoryCost,
            TimeCost = TimeCost,
            Lanes = Parallelism,
            Threads = Parallelism,
            Password = System.Text.Encoding.UTF8.GetBytes(password),
            Salt = GenerateSalt(),
            HashLength = HashLength
        };

        using var argon2 = new Argon2(config);
        using var hash = argon2.Hash();
        return config.EncodeString(hash.Buffer);
    }

    public bool Verify(string password, string encodedHash)
    {
        if (string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(encodedHash))
            return false;

        // Argon2.Verify() sử dụng CryptographicOperations.FixedTimeEquals nội bộ
        // → đảm bảo constant-time compare, chống timing attack
        return Argon2.Verify(encodedHash, password);
    }

    private static byte[] GenerateSalt()
    {
        var salt = new byte[16];
        RandomNumberGenerator.Fill(salt);
        return salt;
    }
}
