using LMS.Domain.Entities;
using LMS.Domain.Interfaces;
using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LMS.Infrastructure.Persistence.Repositories;

public sealed class AssignmentRepository : IAssignmentRepository
{
    private readonly AppDbContext _db;

    public AssignmentRepository(AppDbContext db) => _db = db;

    public async Task<Assignment?> GetByIdAsync(
        Guid              assignmentId,
        CancellationToken cancellationToken = default) =>
        await _db.Assignments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId, cancellationToken);
}

public sealed class AssignmentSubmissionRepository : IAssignmentSubmissionRepository
{
    private readonly AppDbContext _db;

    public AssignmentSubmissionRepository(AppDbContext db) => _db = db;

    public async Task AddAsync(
        AssignmentSubmission submission,
        CancellationToken    cancellationToken = default)
    {
        await _db.AssignmentSubmissions.AddAsync(submission, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<AssignmentSubmission?> GetByIdAsync(
        Guid              submissionId,
        CancellationToken cancellationToken = default) =>
        await _db.AssignmentSubmissions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.SubmissionId == submissionId, cancellationToken);

    /// <summary>
    /// BR-16: Kiểm tra sinh viên đã nộp bài cho assignment này chưa.
    /// Unique index (AssignmentId, StudentId) trên DB là lớp bảo vệ thứ hai.
    /// </summary>
    public async Task<bool> ExistsAsync(
        Guid              assignmentId,
        Guid              studentId,
        CancellationToken cancellationToken = default) =>
        await _db.AssignmentSubmissions
            .AnyAsync(
                s => s.AssignmentId == assignmentId && s.StudentId == studentId,
                cancellationToken);
}
