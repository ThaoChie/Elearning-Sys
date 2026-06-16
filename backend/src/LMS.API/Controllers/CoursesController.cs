using LMS.Infrastructure.Persistence;
using LMS.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LMS.API.Extensions;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CoursesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetCourses()
    {
        var studentId = User.GetUserId(); // Can be null if not logged in

        var courses = await _dbContext.Courses
            .Select(c => new
            {
                id = c.CourseId,
                title = c.Title,
                category = c.Category,
                instructorId = c.InstructorId,
                rating = c.Rating
            })
            .ToListAsync();

        var instructorIds = courses.Select(c => c.instructorId).Distinct().ToList();
        var instructors = await _dbContext.Users
            .Where(u => instructorIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Email);

        var enrollments = studentId.HasValue ? await _dbContext.CourseEnrollments
            .Where(ce => ce.StudentId == studentId.Value)
            .Select(ce => ce.CourseId)
            .ToListAsync() : new List<Guid>();

        var result = courses.Select(c => new
        {
            id = c.id,
            title = c.title,
            category = c.category,
            instructorName = instructors.GetValueOrDefault(c.instructorId, "Unknown Instructor"),
            isEnrolled = enrollments.Contains(c.id),
            rating = c.rating
        });

        return Ok(result);
    }

    [HttpPost("{id}/enroll")]
    [Authorize(Policy = "StudentOnly")]
    public async Task<IActionResult> Enroll(Guid id)
    {
        var studentId = User.GetRequiredUserId();

        var courseExists = await _dbContext.Courses.AnyAsync(c => c.CourseId == id);
        if (!courseExists)
        {
            return NotFound(new { message = "Course not found" });
        }

        var alreadyEnrolled = await _dbContext.CourseEnrollments
            .AnyAsync(ce => ce.CourseId == id && ce.StudentId == studentId);

        if (alreadyEnrolled)
        {
            return BadRequest(new { message = "Already enrolled in this course" });
        }

        var enrollment = CourseEnrollment.Create(id, studentId);
        _dbContext.CourseEnrollments.Add(enrollment);
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Enrolled successfully" });
    }
}
