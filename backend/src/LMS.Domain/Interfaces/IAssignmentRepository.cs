using LMS.Domain.Entities;

namespace LMS.Domain.Interfaces;

/// <summary>
/// Repository truy xuất Assignment từ database.
/// </summary>
public interface IAssignmentRepository
{
    /// <summary>Tìm Assignment theo ID. Trả null nếu không tồn tại.</summary>
    Task<Assignment?> GetByIdAsync(Guid assignmentId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Repository lưu/truy xuất bài nộp (Submission).
/// </summary>
public interface IAssignmentSubmissionRepository
{
    /// <summary>Lưu bài nộp mới.</summary>
    Task AddAsync(AssignmentSubmission submission, CancellationToken cancellationToken = default);

    /// <summary>Lấy bài nộp theo submissionId.</summary>
    Task<AssignmentSubmission?> GetByIdAsync(Guid submissionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Kiểm tra sinh viên đã nộp bài cho assignment này chưa.
    /// Dùng để ngăn nộp trùng (BR-16).
    /// </summary>
    Task<bool> ExistsAsync(Guid assignmentId, Guid studentId, CancellationToken cancellationToken = default);
}
