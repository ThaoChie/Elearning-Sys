namespace LMS.Infrastructure.Audit;

public sealed class AuditLogOptions
{
    public const string SectionName = "AuditLog";
    public string HmacSecretKeyBase64 { get; init; } = string.Empty;
}
