namespace LMS.Domain.Entities;

/// <summary>
/// Trạng thái của bài nộp.
/// </summary>
public enum SubmissionStatus
{
    /// <summary>Đang chờ chấm / xử lý.</summary>
    Pending,

    /// <summary>Đã chấm xong.</summary>
    Graded
}

/// <summary>
/// Đại diện cho một bài tập trong khoá học.
/// </summary>
public class Assignment
{
    public Guid   AssignmentId { get; private set; }
    public Guid   CourseId     { get; private set; }
    public string Title        { get; private set; } = string.Empty;
    public string Description  { get; private set; } = string.Empty;

    /// <summary>Deadline nộp bài (UTC).</summary>
    public DateTime DueAt     { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Assignment() { }

    public static Assignment Create(Guid courseId, string title, string description, DateTime dueAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        var now = DateTime.UtcNow;
        return new Assignment
        {
            AssignmentId = Guid.NewGuid(),
            CourseId     = courseId,
            Title        = title,
            Description  = description,
            DueAt        = dueAt,
            CreatedAt    = now
        };
    }
}

/// <summary>
/// Bài nộp của sinh viên cho một bài tập.
///
/// Bảo mật:
/// - <see cref="StudentId"/> lấy từ JWT Claims, KHÔNG từ URL/Body.
/// - <see cref="StorageKey"/> là UUID ngẫu nhiên – không tiết lộ tên file gốc.
/// - File đã được mã hoá AES-256 trước khi lưu vào Storage.
/// - <see cref="OriginalFileName"/> chỉ dùng để hiển thị, KHÔNG dùng để truy cập storage.
/// </summary>
public class AssignmentSubmission
{
    public Guid             SubmissionId     { get; private set; }
    public Guid             AssignmentId     { get; private set; }

    /// <summary>
    /// ID sinh viên – lấy từ JWT Claims.
    /// </summary>
    public Guid             StudentId        { get; private set; }

    /// <summary>
    /// Tên file gốc (hiển thị cho giảng viên). Không dùng làm key storage.
    /// </summary>
    public string           OriginalFileName { get; private set; } = string.Empty;

    /// <summary>
    /// UUID ngẫu nhiên dùng làm key trong Object Storage (MinIO/Azure Blob).
    /// File tương ứng đã được mã hoá AES-256-CBC.
    /// </summary>
    public string           StorageKey       { get; private set; } = string.Empty;

    /// <summary>
    /// MIME type thực tế (đã xác minh bằng magic bytes).
    /// </summary>
    public string           MimeType         { get; private set; } = string.Empty;

    /// <summary>Kích thước file gốc (byte), trước khi mã hoá.</summary>
    public long             FileSizeBytes    { get; private set; }

    public SubmissionStatus Status           { get; private set; }
    public DateTime         SubmittedAt      { get; private set; }

    public decimal?         Score            { get; private set; }
    public string?          Feedback         { get; private set; }

    private AssignmentSubmission() { }

    /// <summary>
    /// Tạo bản ghi bài nộp mới sau khi file đã được xác thực và lưu trữ an toàn.
    /// </summary>
    /// <param name="assignmentId">ID bài tập.</param>
    /// <param name="studentId">ID sinh viên – từ JWT Claims.</param>
    /// <param name="originalFileName">Tên file gốc (chỉ để hiển thị).</param>
    /// <param name="storageKey">UUID key trong Object Storage.</param>
    /// <param name="mimeType">MIME type đã xác minh bằng magic bytes.</param>
    /// <param name="fileSizeBytes">Kích thước file gốc (byte).</param>
    public static AssignmentSubmission Create(
        Guid   assignmentId,
        Guid   studentId,
        string originalFileName,
        string storageKey,
        string mimeType,
        long   fileSizeBytes)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(originalFileName);
        ArgumentException.ThrowIfNullOrWhiteSpace(storageKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(mimeType);

        if (fileSizeBytes <= 0)
            throw new ArgumentOutOfRangeException(nameof(fileSizeBytes), "Kích thước file phải lớn hơn 0.");

        return new AssignmentSubmission
        {
            SubmissionId     = Guid.NewGuid(),
            AssignmentId     = assignmentId,
            StudentId        = studentId,
            OriginalFileName = originalFileName,
            StorageKey       = storageKey,
            MimeType         = mimeType,
            FileSizeBytes    = fileSizeBytes,
            Status           = SubmissionStatus.Pending,
            SubmittedAt      = DateTime.UtcNow
        };
    }

    public void Grade(decimal score, string feedback)
    {
        Score = score;
        Feedback = feedback;
        Status = SubmissionStatus.Graded;
    }
}
