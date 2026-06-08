namespace LMS.Domain.Interfaces;

/// <summary>
/// Kết quả quét virus trả về từ ClamAV.
/// </summary>
public record ClamAvScanResult(bool IsClean, string VirusName);

/// <summary>
/// Kết quả kiểm tra MIME type bằng magic bytes.
/// </summary>
public record MimeValidationResult(bool IsAllowed, string DetectedMime);

/// <summary>
/// Dịch vụ bảo mật file: xác thực định dạng thực tế (magic bytes),
/// quét virus (ClamAV) và mã hoá AES-256 trước khi lưu.
///
/// Nguyên tắc: KHÔNG tin Content-Type header từ client.
/// </summary>
public interface IFileSecurityService
{
    /// <summary>
    /// Đọc magic bytes của stream để xác định MIME type thực tế.
    /// Trả về kết quả gồm có được phép hay không và MIME type phát hiện được.
    /// </summary>
    /// <param name="fileStream">Stream của file upload (đọc từ đầu).</param>
    /// <param name="allowedMimeTypes">Danh sách MIME type chấp nhận.</param>
    MimeValidationResult ValidateMime(Stream fileStream, IReadOnlyCollection<string> allowedMimeTypes);

    /// <summary>
    /// Gửi file tới ClamAV daemon để quét virus.
    /// </summary>
    /// <param name="fileStream">Stream của file (seek về đầu trước khi quét).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<ClamAvScanResult> ScanVirusAsync(Stream fileStream, CancellationToken cancellationToken = default);

    /// <summary>
    /// Mã hoá nội dung file bằng AES-256-CBC với IV ngẫu nhiên.
    /// IV được ghép vào đầu ciphertext (16 byte IV + ciphertext).
    /// </summary>
    /// <param name="plainStream">Stream dữ liệu gốc.</param>
    /// <returns>Stream đã mã hoá (IV + ciphertext).</returns>
    Task<Stream> EncryptAsync(Stream plainStream);

    /// <summary>
    /// Giải mã file đã được mã hoá bằng <see cref="EncryptAsync"/>.
    /// </summary>
    /// <param name="encryptedStream">Stream IV + ciphertext.</param>
    /// <returns>Stream dữ liệu gốc.</returns>
    Task<Stream> DecryptAsync(Stream encryptedStream);
}
