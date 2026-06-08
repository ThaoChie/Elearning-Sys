namespace LMS.Domain.Entities;

public sealed class AuditLog
{
    public Guid LogID { get; private set; }
    public DateTimeOffset Timestamp { get; private set; }
    public string? ActorID { get; private set; }
    public string Action { get; private set; } = default!;
    public string? IP { get; private set; }
    public string HMACSignature { get; private set; } = default!;

    // EF Core constructor
    private AuditLog() { }

    public static AuditLog Create(
        Guid logId,
        DateTimeOffset timestamp,
        string? actorId,
        string action,
        string? ip,
        string hmacSignature)
    {
        return new AuditLog
        {
            LogID = logId,
            Timestamp = timestamp,
            ActorID = actorId,
            Action = action,
            IP = ip,
            HMACSignature = hmacSignature
        };
    }
}
