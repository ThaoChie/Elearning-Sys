using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using LMS.API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        if (!Guid.TryParse(studentIdStr, out var studentId))
        {
            return Unauthorized();
        }

        // Mock progress & enrolled courses for now
        var enrolledCourses = 3;
        var completedLessons = 12;
        var totalLessons = 45;
        var currentProgress = (int)((completedLessons / (double)totalLessons) * 100);

        var upcomingExams = await db.Quizzes.OrderByDescending(e => e.CreatedAt).Take(2).ToListAsync();

        return Ok(new {
            enrolledCourses,
            completedLessons,
            totalLessons,
            currentProgress,
            upcomingExams = upcomingExams.Select(e => new { id = e.QuizId, title = e.Title })
        });
    }
}
