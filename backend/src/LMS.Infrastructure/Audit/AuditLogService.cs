using System.Security.Cryptography;
using System.Text;
using LMS.Domain.Entities;
using LMS.Domain.Interfaces;
using LMS.Infrastructure.Persistence;
using Microsoft.Extensions.Options;

namespace LMS.Infrastructure.Audit;

public sealed class AuditLogService : IAuditLogService
{
    private readonly AppDbContext _db;
    private readonly byte[] _hmacKey;

    public AuditLogService(AppDbContext db, IOptions<AuditLogOptions> options)
    {
        _db = db;
        var raw = options.Value.HmacSecretKeyBase64;
        if (string.IsNullOrWhiteSpace(raw))
            throw new InvalidOperationException("AuditLog:HmacSecretKeyBase64 is not configured.");
        _hmacKey = Convert.FromBase64String(raw);
    }

    public async Task LogAsync(string? actorId, string action, string? ip, CancellationToken ct = default)
    {
        var logId = Guid.NewGuid();
        var timestamp = DateTimeOffset.UtcNow;

        var payload = BuildPayload(logId, timestamp, actorId, action, ip);
        var signature = ComputeHmac(payload);

        var log = AuditLog.Create(logId, timestamp, actorId, action, ip, signature);

        await _db.Set<AuditLog>().AddAsync(log, ct);
        await _db.SaveChangesAsync(ct);
    }

    // Canonical payload: logId|timestamp|actorId|action|ip
    private static string BuildPayload(
        Guid logId, DateTimeOffset timestamp, string? actorId, string action, string? ip)
        => $"{logId:D}|{timestamp:O}|{actorId ?? ""}|{action}|{ip ?? ""}";

    private string ComputeHmac(string payload)
    {
        var data = Encoding.UTF8.GetBytes(payload);
        var hash = HMACSHA256.HashData(_hmacKey, data);
        return Convert.ToBase64String(hash);
    }
}
