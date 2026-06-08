using LMS.Domain.Entities;

namespace LMS.Domain.Interfaces;

/// <summary>
/// Repository interface cho ExamSession – định nghĩa tại Domain để tuân theo
/// Dependency Inversion Principle (implementation ở Infrastructure).
/// </summary>
public interface IExamSessionRepository
{
    /// <summary>
    /// Lấy phiên thi theo SessionId.
    /// </summary>
    Task<ExamSession?> GetBySessionIdAsync(Guid sessionId, CancellationToken ct = default);

    /// <summary>
    /// Lấy phiên thi ĐANG ACTIVE của một user cho một exam cụ thể.
    /// Ownership check: lọc đồng thời theo cả ExamId và UserId.
    /// </summary>
    Task<ExamSession?> GetActiveSessionAsync(Guid examId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Thêm một phiên thi mới vào context (chưa SaveChanges).
    /// </summary>
    Task AddAsync(ExamSession session, CancellationToken ct = default);

    /// <summary>
    /// Lưu tất cả thay đổi vào database.
    /// </summary>
    Task SaveChangesAsync(CancellationToken ct = default);
}
