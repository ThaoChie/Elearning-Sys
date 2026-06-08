namespace LMS.Domain.Entities;

/// <summary>
/// Chương / Module trong một khoá học.
/// </summary>
public class Module
{
    public Guid     ModuleId  { get; private set; }
    public Guid     CourseId  { get; private set; }
    public string   Title     { get; private set; } = string.Empty;
    public int      Order     { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // EF Core navigation
    public Course Course { get; private set; } = null!;

    private readonly List<Lecture> _lectures = [];
    public IReadOnlyCollection<Lecture> Lectures => _lectures.AsReadOnly();

    private Module() { }

    public static Module Create(Guid courseId, string title, int order)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);

        return new Module
        {
            ModuleId  = Guid.NewGuid(),
            CourseId  = courseId,
            Title     = title.Trim(),
            Order     = order,
            CreatedAt = DateTime.UtcNow
        };
    }
}
