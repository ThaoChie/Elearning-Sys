using LMS.API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LMS.API.Controllers;

/// <summary>
/// InstructorController — Dashboard và dữ liệu dành riêng cho Instructor.
/// Route: /api/instructor
/// Phân quyền: InstructorOrAdmin
/// UserId luôn lấy từ JWT Claims (chống IDOR).
/// </summary>
[ApiController]
[Route("api/instructor")]
[Authorize(Policy = AuthPolicies.InstructorOrAdmin)]
public sealed class InstructorController(AppDbContext db) : ControllerBase
{
    // ════════════════════════════════════════════════════════════════════════
    //  GET /api/instructor/dashboard
    //  B-D02: Dashboard thống kê thật cho Instructor
    // ════════════════════════════════════════════════════════════════════════

    [HttpGet("dashboard")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        try
        {
            var instructorId = User.GetRequiredUserId();

            // 1. Lấy danh sách CourseId của Instructor
            var courseIds = await db.Courses
                .Where(c => c.InstructorId == instructorId)
                .Select(c => c.CourseId)
                .ToListAsync(ct);

            var totalCourses = courseIds.Count;

            // 2. Thống kê thật từ DB (không fake)
            var totalStudents = totalCourses > 0
                ? await db.CourseEnrollments
                    .Where(e => courseIds.Contains(e.CourseId))
                    .Select(e => e.StudentId)
                    .Distinct()
                    .CountAsync(ct)
                : 0;

            var totalExams = totalCourses > 0
                ? await db.Quizzes.CountAsync(q => courseIds.Contains(q.CourseId), ct)
                : 0;

            var totalAssignments = totalCourses > 0
                ? await db.Assignments.CountAsync(a => courseIds.Contains(a.CourseId), ct)
                : 0;

            var pendingSubmissions = totalAssignments > 0
                ? await db.AssignmentSubmissions
                    .Where(s => courseIds.Contains(
                        db.Assignments.Where(a => a.AssignmentId == s.AssignmentId)
                            .Select(a => a.CourseId).FirstOrDefault()))
                    .CountAsync(s => s.Status == LMS.Domain.Entities.SubmissionStatus.Pending, ct)
                : 0;

            // 3. Average Rating từ các Course (field thật)
            var avgRating = totalCourses > 0
                ? await db.Courses
                    .Where(c => c.InstructorId == instructorId && c.Rating > 0)
                    .AverageAsync(c => (double?)c.Rating, ct) ?? 0.0
                : 0.0;

            // 4. Recent quiz activities (5 quiz mới nhất)
            var recentQuizzes = totalCourses > 0
                ? await db.Quizzes
                    .Where(q => courseIds.Contains(q.CourseId))
                    .Include(q => q.Course)
                    .OrderByDescending(q => q.CreatedAt)
                    .Take(5)
                    .Select(q => new {
                        id       = q.QuizId,
                        title    = q.Title,
                        course   = q.Course.Title,
                        questions = q.Questions.Count,
                        createdAt = q.CreatedAt
                    })
                    .ToListAsync(ct)
                : [];

            // 5. Recent assignments (5 bài tập mới nhất)
            var recentAssignments = totalCourses > 0
                ? await db.Assignments
                    .Where(a => courseIds.Contains(a.CourseId))
                    .Join(db.Courses, a => a.CourseId, c => c.CourseId, (a, c) => new {
                        id        = a.AssignmentId,
                        title     = a.Title,
                        course    = c.Title,
                        dueAt     = a.DueAt,
                        isOverdue = a.DueAt < DateTime.UtcNow,
                        createdAt = a.CreatedAt
                    })
                    .OrderByDescending(a => a.createdAt)
                    .Take(5)
                    .ToListAsync(ct)
                : [];

            return Ok(new
            {
                // KPIs cho DashboardStats.tsx
                totalCourses,
                totalStudents,
                totalAssignments,
                totalExams,
                pendingSubmissions,
                avgRating = Math.Round(avgRating, 1),

                // Data cho widgets
                recentQuizzes,
                recentAssignments,
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = "unauthorized", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  GET /api/instructor/assignments
    // ════════════════════════════════════════════════════════════════════════

    [HttpGet("assignments")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAssignments(CancellationToken ct)
    {
        try
        {
            var instructorId = User.GetRequiredUserId();

            var courseIds = await db.Courses
                .Where(c => c.InstructorId == instructorId)
                .Select(c => c.CourseId)
                .ToListAsync(ct);

            var assignments = await db.Assignments
                .Where(a => courseIds.Contains(a.CourseId))
                .Join(db.Courses, a => a.CourseId, c => c.CourseId, (a, c) => new {
                    id               = a.AssignmentId,
                    title            = a.Title,
                    description      = a.Description,
                    courseId         = a.CourseId,
                    courseName       = c.Title,
                    dueAt            = a.DueAt,
                    createdAt        = a.CreatedAt,
                    isOverdue        = a.DueAt < DateTime.UtcNow,
                    submissionsCount = db.AssignmentSubmissions
                        .Count(s => s.AssignmentId == a.AssignmentId),
                    pendingCount     = db.AssignmentSubmissions
                        .Count(s => s.AssignmentId == a.AssignmentId
                                 && s.Status == LMS.Domain.Entities.SubmissionStatus.Pending)
                })
                .OrderByDescending(a => a.createdAt)
                .ToListAsync(ct);

            return Ok(assignments);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }
}
