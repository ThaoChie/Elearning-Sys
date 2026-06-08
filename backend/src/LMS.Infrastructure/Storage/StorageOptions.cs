namespace LMS.Infrastructure.Storage;

/// <summary>
/// Cấu hình kết nối MinIO (hoặc Azure Blob nếu override).
/// Bind từ appsettings section "Storage".
/// </summary>
public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>MinIO endpoint, VD: "http://localhost:9000".</summary>
    public string Endpoint  { get; init; } = string.Empty;

    /// <summary>Access key (MinIO access key hoặc Azure account name).</summary>
    public string AccessKey { get; init; } = string.Empty;

    /// <summary>Secret key (MinIO secret key hoặc Azure account key).</summary>
    public string SecretKey { get; init; } = string.Empty;

    /// <summary>Bucket name (MinIO) hoặc container name (Azure Blob).</summary>
    public string BucketName { get; init; } = "lms-assignments";

    /// <summary>Có dùng SSL hay không (cho MinIO).</summary>
    public bool UseSSL { get; init; } = false;
}
