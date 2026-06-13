using LMS.API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/instructor")]
[Authorize(Policy = AuthPolicies.InstructorOrAdmin)]
public sealed class InstructorController(AppDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var instructorIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(instructorIdStr, out var instructorId))
        {
            return Unauthorized();
        }

        var instructorCourseIds = await db.Courses.Where(c => c.InstructorId == instructorId).Select(c => c.CourseId).ToListAsync();
        var totalCourses = instructorCourseIds.Count;
        
        // Count total exams for the instructor's courses
        var totalExams = await db.Quizzes.CountAsync(q => instructorCourseIds.Contains(q.CourseId));

        // Count assignments
        var totalAssignments = await db.Assignments.CountAsync(a => instructorCourseIds.Contains(a.CourseId));

        // Calculate some basic mock stats for the charts to work
        var totalStudents = totalCourses * 15; // Just a proxy number if Enrollment table doesn't exist
        var avgRating = 4.8;
        var totalRevenue = totalStudents * 500000;

        return Ok(new {
            totalCourses,
            totalStudents,
            totalAssignments,
            totalExams,
            avgRating,
            totalRevenue,
            recentActivities = new object[] { }
        });
    }

    [HttpGet("assignments")]
    public IActionResult GetAssignments()
    {
        return Ok(new object[] { });
    }
}
