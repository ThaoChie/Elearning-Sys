using LMS.API.Extensions;
using LMS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LMS.Domain.Entities;

namespace LMS.API.Controllers;

/// <summary>
/// StudentController — Dashboard và dữ liệu dành riêng cho Student.
/// Route: /api/student
/// Phân quyền: StudentOnly
/// UserId luôn lấy từ JWT Claims (chống IDOR).
/// </summary>
[ApiController]
[Route("api/student")]
[Authorize(Policy = AuthPolicies.StudentOnly)]
public sealed class StudentController(AppDbContext db) : ControllerBase
{
    // ════════════════════════════════════════════════════════════════════════
    //  GET /api/student/dashboard
    //  B-D03: Dashboard thống kê thật cho Student
    // ════════════════════════════════════════════════════════════════════════

    [HttpGet("dashboard")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        try
        {
            var studentId = User.GetRequiredUserId();

            // 1. Các khoá học đã đăng ký (JOIN với Course)
            var enrolledData = await db.CourseEnrollments
                .Where(e => e.StudentId == studentId)
                .Join(db.Courses
                          .Include(c => c.Modules).ThenInclude(m => m.Lectures),
                      e => e.CourseId,
                      c => c.CourseId,
                      (e, c) => new { Enrollment = e, Course = c })
                .OrderByDescending(x => x.Enrollment.EnrolledAt)
                .ToListAsync(ct);

            var courseCards = enrolledData.Select(x =>
            {
                var totalLectures = x.Course.Modules.Sum(m => m.Lectures.Count);
                return new
                {
                    id               = x.Course.CourseId,
                    title            = x.Course.Title,
                    thumbnailUrl     = x.Course.ThumbnailUrl,
                    category         = x.Course.Category,
                    totalLessons     = totalLectures,
                    // Chưa có LectureProgress entity → completedLessons = 0 (sẽ mở rộng sau)
                    completedLessons = 0,
                    progress         = 0,
                    enrolledAt       = x.Enrollment.EnrolledAt,
                    isEnrolled       = true
                };
            }).ToList();

            // 2. KPI summary
            var totalEnrolled    = enrolledData.Count;
            var totalLessons     = courseCards.Sum(c => c.totalLessons);
            var completedLessons = courseCards.Sum(c => c.completedLessons);
            var currentProgress  = totalLessons > 0
                ? (int)(completedLessons * 100.0 / totalLessons)
                : 0;

            // 3. Bài tập đang chờ nộp (deadline chưa qua)
            var courseIds = enrolledData.Select(x => x.Enrollment.CourseId).ToList();
            var pendingAssignments = courseIds.Count > 0
                ? await db.Assignments
                    .Where(a => courseIds.Contains(a.CourseId) && a.DueAt > DateTime.UtcNow)
                    .OrderBy(a => a.DueAt)
                    .Take(5)
                    .Select(a => new {
                        id     = a.AssignmentId,
                        title  = a.Title,
                        dueAt  = a.DueAt,
                        courseId = a.CourseId
                    })
                    .ToListAsync(ct)
                : [];

            // 4. Bài kiểm tra sắp tới (quiz trong các course đã đăng ký)
            var upcomingExams = courseIds.Count > 0
                ? await db.Quizzes
                    .Where(q => courseIds.Contains(q.CourseId))
                    .Include(q => q.Course)
                    .OrderByDescending(q => q.CreatedAt)
                    .Take(5)
                    .Select(q => new {
                        id           = q.QuizId,
                        title        = q.Title,
                        courseName   = q.Course.Title,
                        durationMin  = q.TimeLimitMin,
                        startAt      = q.StartAt,
                        questionCount = q.Questions.Count
                    })
                    .ToListAsync(ct)
                : [];

            // 5. Số bài nộp của student
            var submissionsCount = await db.AssignmentSubmissions
                .CountAsync(s => s.StudentId == studentId, ct);

            return Ok(new
            {
                // KPIs
                enrolledCourses    = totalEnrolled,
                totalLessons,
                completedLessons,
                currentProgress,
                submissionsCount,
                // averageScore: chưa có ExamResult entity → 0.0 (placeholder)
                averageScore       = 0.0,

                // Lists
                courses            = courseCards,
                pendingAssignments,
                upcomingExams,
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
    //  GET /api/student/reports
    // ════════════════════════════════════════════════════════════════════════

    [HttpGet("reports")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReports(CancellationToken ct)
    {
        try
        {
            var studentId = User.GetRequiredUserId();

            var enrollments = await db.CourseEnrollments
                .Where(e => e.StudentId == studentId)
                .Join(db.Courses, e => e.CourseId, c => c.CourseId, (e, c) => new { e, c })
                .ToListAsync(ct);

            var reports = enrollments.Select(x => new {
                courseId   = x.e.CourseId,
                course     = x.c.Title,
                score      = (double?)null,
                status     = "In Progress",
                certId     = (string?)null,
                enrolledAt = x.e.EnrolledAt
            }).ToList();

            return Ok(new { reports });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  GET /api/student/courses — Tất cả khoá học (để browse)
    // ════════════════════════════════════════════════════════════════════════

    [HttpGet("courses")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllCourses(CancellationToken ct)
    {
        try
        {
            var studentId = User.GetRequiredUserId();

            var enrolledIds = await db.CourseEnrollments
                .Where(e => e.StudentId == studentId)
                .Select(e => e.CourseId)
                .ToHashSetAsync(ct);

            var courses = await db.Courses
                .Where(c => c.IsPublished)
                .Select(c => new {
                    id           = c.CourseId,
                    title        = c.Title,
                    description  = c.Description,
                    thumbnailUrl = c.ThumbnailUrl,
                    category     = c.Category,
                    rating       = c.Rating,
                    isEnrolled   = enrolledIds.Contains(c.CourseId)
                })
                .ToListAsync(ct);

            return Ok(courses);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  POST /api/student/courses/{courseId}/enroll
    // ════════════════════════════════════════════════════════════════════════

    [HttpPost("courses/{courseId:guid}/enroll")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> EnrollCourse(Guid courseId, CancellationToken ct)
    {
        try
        {
            var studentId = User.GetRequiredUserId();

            var course = await db.Courses.FindAsync([courseId], ct);
            if (course == null)
                return NotFound(new { error = "not_found", message = "Không tìm thấy khoá học." });

            var existing = await db.CourseEnrollments
                .AnyAsync(e => e.CourseId == courseId && e.StudentId == studentId, ct);

            if (existing)
                return Conflict(new { error = "already_enrolled", message = "Bạn đã đăng ký khoá học này rồi." });

            var enrollment = CourseEnrollment.Create(courseId, studentId);
            db.CourseEnrollments.Add(enrollment);
            await db.SaveChangesAsync(ct);

            return Ok(new { message = "Đăng ký khoá học thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }
}
