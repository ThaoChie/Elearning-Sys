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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCourseById(Guid id)
    {
        var studentId = User.GetUserId();

        var course = await _dbContext.Courses
            .Include(c => c.Modules)
                .ThenInclude(m => m.Lectures)
            .FirstOrDefaultAsync(c => c.CourseId == id);

        if (course == null)
            return NotFound(new { message = "Course not found" });

        var instructor = await _dbContext.Users.FindAsync(course.InstructorId);

        var isEnrolled = false;
        if (studentId.HasValue)
        {
            isEnrolled = await _dbContext.CourseEnrollments
                .AnyAsync(ce => ce.CourseId == id && ce.StudentId == studentId.Value);
        }

        var result = new
        {
            id = course.CourseId,
            title = course.Title,
            description = course.Description,
            category = course.Category,
            thumbnailUrl = course.ThumbnailUrl,
            instructorName = instructor?.Email ?? "Unknown",
            rating = course.Rating,
            isEnrolled = isEnrolled,
            totalLessons = course.Modules.SelectMany(m => m.Lectures).Count(),
            lessonsCount = course.Modules.SelectMany(m => m.Lectures).Count(),
            duration = "48 giờ", // Giả lập
            students = 1240, // Giả lập
            progress = isEnrolled ? 20 : 0, // Giả lập
            completedLessons = isEnrolled ? 3 : 0, // Giả lập
            remainingMinutes = 480, // Giả lập
            enrolledAt = isEnrolled ? DateTime.UtcNow.ToString("O") : null,
            lastAccessAt = isEnrolled ? DateTime.UtcNow.ToString("O") : null,
            nextLessonId = course.Modules.FirstOrDefault()?.Lectures.FirstOrDefault()?.LectureId.ToString(),
            syllabus = course.Modules.OrderBy(m => m.Order).Select(m => new
            {
                id = m.ModuleId,
                title = m.Title,
                lessons = m.Lectures.OrderBy(l => l.Order).Select(l => new
                {
                    id = l.LectureId,
                    title = l.Title,
                    duration = $"{l.DurationSecs / 60}:{l.DurationSecs % 60:D2}",
                    type = "video",
                    completed = false,
                    isCurrent = false,
                    videoUrl = l.VideoUrl
                })
            })
        };

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

    [HttpPost]
    [Authorize(Roles = "Instructor,Admin")]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseDto dto)
    {
        var instructorId = User.GetRequiredUserId();
        
        var course = Course.Create(
            instructorId, 
            dto.Title, 
            dto.Description, 
            dto.Category ?? string.Empty, 
            dto.ThumbnailUrl ?? string.Empty);

        _dbContext.Courses.Add(course);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCourseById), new { id = course.CourseId }, new
        {
            id = course.CourseId,
            title = course.Title,
            description = course.Description,
            category = course.Category,
            thumbnailUrl = course.ThumbnailUrl
        });
    }

    [HttpPut("{id}/syllabus")]
    [Authorize(Roles = "Instructor,Admin")]
    public async Task<IActionResult> UpdateSyllabus(Guid id, [FromBody] UpdateSyllabusDto dto)
    {
        var course = await _dbContext.Courses
            .Include(c => c.Modules)
                .ThenInclude(m => m.Lectures)
            .FirstOrDefaultAsync(c => c.CourseId == id);

        if (course == null)
            return NotFound(new { message = "Course not found" });

        // Remove old modules and lectures
        _dbContext.Modules.RemoveRange(course.Modules);
        await _dbContext.SaveChangesAsync();

        // Add new modules
        for (int i = 0; i < dto.Modules.Count; i++)
        {
            var modDto = dto.Modules[i];
            var module = LMS.Domain.Entities.Module.Create(course.CourseId, modDto.Title, i + 1);
            _dbContext.Modules.Add(module);
            await _dbContext.SaveChangesAsync();

            for (int j = 0; j < modDto.Lessons.Count; j++)
            {
                var lesDto = modDto.Lessons[j];
                int duration = 0;
                if (!string.IsNullOrEmpty(lesDto.Duration) && lesDto.Duration.Contains(":"))
                {
                    var parts = lesDto.Duration.Split(':');
                    if (parts.Length == 2 && int.TryParse(parts[0], out int min) && int.TryParse(parts[1], out int sec))
                    {
                        duration = min * 60 + sec;
                    }
                }
                var lecture = LMS.Domain.Entities.Lecture.Create(
                    module.ModuleId, 
                    lesDto.Title, 
                    lesDto.VideoUrl ?? string.Empty, 
                    duration, 
                    j + 1);
                _dbContext.Lectures.Add(lecture);
            }
            await _dbContext.SaveChangesAsync();
        }

        return Ok(new { message = "Syllabus updated successfully" });
    }
}

public class CreateCourseDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
}

public class UpdateSyllabusDto
{
    public List<ModuleDto> Modules { get; set; } = new();
}

public class ModuleDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<LessonDto> Lessons { get; set; } = new();
}

public class LessonDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
}
