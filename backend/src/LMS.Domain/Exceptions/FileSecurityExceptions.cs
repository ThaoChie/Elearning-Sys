namespace LMS.Domain.Exceptions;

/// <summary>
/// Ném khi ClamAV phát hiện virus/malware trong file upload.
/// </summary>
public sealed class VirusDetectedException(string fileName, string virusName)
    : Exception($"File '{fileName}' bị từ chối: phát hiện mối đe dọa '{virusName}'.")
{
    public string FileName  { get; } = fileName;
    public string VirusName { get; } = virusName;
}

/// <summary>
/// Ném khi MIME type thực tế (magic bytes) không khớp với các định dạng được phép.
/// </summary>
public sealed class InvalidMimeTypeException(string fileName, string detectedMime)
    : Exception($"File '{fileName}' bị từ chối: định dạng '{detectedMime}' không được phép upload.")
{
    public string FileName     { get; } = fileName;
    public string DetectedMime { get; } = detectedMime;
}

/// <summary>
/// Ném khi file upload vượt quá giới hạn dung lượng (BR-18: <= 50 MB).
/// </summary>
public sealed class FileSizeExceededException(string fileName, long actualBytes, long maxBytes)
    : Exception($"File '{fileName}' vượt quá kích thước cho phép ({actualBytes / 1_048_576} MB > {maxBytes / 1_048_576} MB).")
{
    public string FileName    { get; } = fileName;
    public long   ActualBytes { get; } = actualBytes;
    public long   MaxBytes    { get; } = maxBytes;
}
