namespace LMS.Domain.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(string? actorId, string action, string? ip, CancellationToken ct = default);
}
