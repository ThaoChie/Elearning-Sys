namespace LMS.Application.Features.Assignment.Commands;

/// <summary>
/// Kết quả trả về sau khi nộp bài thành công.
/// </summary>
public sealed class SubmitAssignmentResponse
{
    /// <summary>ID bài nộp vừa tạo.</summary>
    public Guid   SubmissionId     { get; init; }

    /// <summary>Tên file gốc (chỉ để hiển thị).</summary>
    public string OriginalFileName { get; init; } = string.Empty;

    /// <summary>MIME type đã xác minh bằng magic bytes.</summary>
    public string MimeType         { get; init; } = string.Empty;

    /// <summary>Kích thước file (byte).</summary>
    public long   FileSizeBytes    { get; init; }

    /// <summary>Thời điểm nộp bài (UTC).</summary>
    public DateTime SubmittedAt    { get; init; }

    /// <summary>Key lưu trữ file.</summary>
    public string   StorageKey       { get; init; } = string.Empty;
}
