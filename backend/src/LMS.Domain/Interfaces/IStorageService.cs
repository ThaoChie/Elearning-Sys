namespace LMS.Domain.Interfaces;

/// <summary>
/// Dịch vụ lưu trữ file vào Object Storage (MinIO / Azure Blob).
/// </summary>
public interface IStorageService
{
    /// <summary>
    /// Upload stream lên Object Storage với key cho trước.
    /// </summary>
    /// <param name="key">Object key (UUID ngẫu nhiên).</param>
    /// <param name="contentStream">Stream nội dung (đã mã hoá).</param>
    /// <param name="contentType">MIME type để lưu metadata (tuỳ chọn).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task UploadAsync(string key, Stream contentStream, string? contentType = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Download object theo key.
    /// </summary>
    Task<Stream> DownloadAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Xoá object theo key.
    /// </summary>
    Task DeleteAsync(string key, CancellationToken cancellationToken = default);
}
