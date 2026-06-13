namespace LMS.Domain.Entities;

public enum NotificationType
{
    System = 0,
    Course = 1,
    Assignment = 2,
    Exam = 3
}

public class Notification
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public bool IsRead { get; private set; } = false;
    public NotificationType Type { get; private set; }
    
    /// <summary>
    /// ID của thực thể liên quan (VD: CourseId, AssignmentId).
    /// Null nếu là thông báo hệ thống chung.
    /// </summary>
    public Guid? RelatedEntityId { get; private set; }
    
    public DateTime CreatedAt { get; private set; }

    // Navigation property
    public User? User { get; private set; }

    private Notification() { }

    public static Notification Create(Guid userId, string title, string message, NotificationType type, Guid? relatedEntityId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(message);

        return new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            RelatedEntityId = relatedEntityId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void MarkAsRead()
    {
        IsRead = true;
    }
}
