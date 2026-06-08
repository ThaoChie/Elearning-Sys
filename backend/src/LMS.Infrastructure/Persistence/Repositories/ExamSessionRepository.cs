using LMS.Domain.Entities;
using LMS.Domain.Interfaces;
using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LMS.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repository cho ExamSession sử dụng EF Core.
///
/// Ownership Check: GetActiveSessionAsync lọc đồng thời ExamId + UserId
/// để đảm bảo user chỉ truy cập phiên thi của chính mình.
/// </summary>
public sealed class ExamSessionRepository(AppDbContext db) : IExamSessionRepository
{
    public Task<ExamSession?> GetBySessionIdAsync(Guid sessionId, CancellationToken ct = default) =>
        db.ExamSessions
          .FirstOrDefaultAsync(s => s.SessionId == sessionId, ct);

    /// <summary>
    /// Truy vấn có Ownership Check (ExamId + UserId) + Status = Active.
    /// Tránh trường hợp user A dùng SessionId của user B.
    /// </summary>
    public Task<ExamSession?> GetActiveSessionAsync(Guid examId, Guid userId, CancellationToken ct = default) =>
        db.ExamSessions
          .FirstOrDefaultAsync(
              s => s.ExamId == examId &&
                   s.UserId == userId &&
                   s.Status == ExamSessionStatus.Active,
              ct);

    public async Task AddAsync(ExamSession session, CancellationToken ct = default) =>
        await db.ExamSessions.AddAsync(session, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);
}
