using LMS.Domain.Entities;

namespace LMS.Application.Notifications;

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string Type { get; set; } = string.Empty;
    public Guid? RelatedEntityId { get; set; }
    public DateTime CreatedAt { get; set; }

    public static NotificationDto FromEntity(Notification entity)
    {
        return new NotificationDto
        {
            Id = entity.Id,
            Title = entity.Title,
            Message = entity.Message,
            IsRead = entity.IsRead,
            Type = entity.Type.ToString(),
            RelatedEntityId = entity.RelatedEntityId,
            CreatedAt = entity.CreatedAt
        };
    }
}
