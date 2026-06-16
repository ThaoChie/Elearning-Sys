namespace LMS.Domain.Entities;

/// <summary>
/// Khoá học trong hệ thống LMS.
/// </summary>
public class Course
{
    public Guid     CourseId    { get; private set; }
    public Guid     InstructorId { get; private set; }
    public string   Title       { get; private set; } = string.Empty;
    public string   Description { get; private set; } = string.Empty;
    public string   ThumbnailUrl { get; private set; } = string.Empty;
    public string   Category    { get; private set; } = string.Empty;
    public decimal  Rating      { get; private set; } = 0m;
    public bool     IsPublished { get; private set; }
    public DateTime CreatedAt   { get; private set; }

    private readonly List<Module> _modules = [];
    public IReadOnlyCollection<Module> Modules => _modules.AsReadOnly();

    private readonly List<Quiz> _quizzes = [];
    public IReadOnlyCollection<Quiz> Quizzes => _quizzes.AsReadOnly();

    private Course() { }

    public static Course Create(Guid instructorId, string title, string description, string thumbnailUrl = "")
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);

        return new Course
        {
            CourseId     = Guid.NewGuid(),
            InstructorId = instructorId,
            Title        = title.Trim(),
            Description  = description.Trim(),
            ThumbnailUrl = thumbnailUrl,
            IsPublished  = false,
            CreatedAt    = DateTime.UtcNow
        };
    }

    public void Publish() => IsPublished = true;
}
