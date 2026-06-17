using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using LMS.API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LMS.Domain.Entities;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/student")]
[Authorize(Policy = AuthPolicies.StudentOnly)]
public sealed class StudentController(AppDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var studentIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(studentIdStr, out var studentId)) return Unauthorized();

        var enrollments = await db.CourseEnrollments
            .Where(e => e.StudentId == studentId)
            .Join(db.Courses, e => e.CourseId, c => c.CourseId, (e, c) => new { e, c })
            .ToListAsync();

        var enrolledCourses = enrollments.Count;
        var completedLessons = 12; // Tạm giả lập
        var totalLessons = 45;
        var currentProgress = totalLessons > 0 ? (int)((completedLessons / (double)totalLessons) * 100) : 0;

        var courses = enrollments.Select(x => new {
            id = x.c.CourseId,
            title = x.c.Title,
            instructorName = "Giảng viên",
            thumbnailUrl = x.c.ThumbnailUrl,
            isEnrolled = true,
            enrolledUserId = studentIdStr,
            progress = currentProgress,
            completedLessons = completedLessons,
            totalLessons = totalLessons,
            remainingMinutes = 120,
            category = "Lập trình",
            enrolledAt = x.e.EnrolledAt
        }).ToList();

        var upcomingExams = await db.Quizzes.OrderByDescending(e => e.CreatedAt).Take(2).ToListAsync();

        return Ok(new {
            courses,
            enrolledCourses,
            completedLessons,
            totalLessons,
            currentProgress,
            averageScore = 8.5,
            upcomingExams = upcomingExams.Select(e => new { id = e.QuizId, title = e.Title, courseName = "System", startAt = DateTime.UtcNow.AddDays(1) })
        });
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
    {
        var studentIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(studentIdStr, out var studentId)) return Unauthorized();

        var enrollments = await db.CourseEnrollments
            .Where(e => e.StudentId == studentId)
            .Join(db.Courses, e => e.CourseId, c => c.CourseId, (e, c) => c)
            .ToListAsync();

        var reports = enrollments.Select(c => new {
            course = c.Title,
            score = 8.5,
            status = "Passed",
            certId = $"CERT-{DateTime.UtcNow.Year}-{c.CourseId.ToString().Substring(0,4).ToUpper()}"
        }).ToList();

        return Ok(new { reports });
    }

    [HttpGet("courses")]
    public async Task<IActionResult> GetAllCourses()
    {
        var courses = await db.Courses.Select(c => new {
            id = c.CourseId,
            title = c.Title,
            description = c.Description,
            thumbnailUrl = c.ThumbnailUrl
        }).ToListAsync();

        return Ok(courses);
    }

    [HttpPost("courses/{courseId}/enroll")]
    public async Task<IActionResult> EnrollCourse(Guid courseId)
    {
        var studentIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(studentIdStr, out var studentId)) return Unauthorized();

        var course = await db.Courses.FindAsync(courseId);
        if (course == null) return NotFound("Course not found");

        var existing = await db.CourseEnrollments.FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == studentId);
        if (existing == null)
        {
            var enrollment = CourseEnrollment.Create(courseId, studentId);
            await db.CourseEnrollments.AddAsync(enrollment);
            await db.SaveChangesAsync();
        }

        return Ok(new { message = "Enrolled successfully" });
    }
}
