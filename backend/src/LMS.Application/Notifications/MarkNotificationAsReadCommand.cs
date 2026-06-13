using LMS.Domain.Interfaces;
using MediatR;

namespace LMS.Application.Notifications;

public record MarkNotificationAsReadCommand(Guid UserId, Guid NotificationId) : IRequest;

public class MarkNotificationAsReadCommandHandler(INotificationRepository repository) 
    : IRequestHandler<MarkNotificationAsReadCommand>
{
    public async Task Handle(MarkNotificationAsReadCommand request, CancellationToken cancellationToken)
    {
        var notification = await repository.GetByIdAsync(request.NotificationId, cancellationToken);

        if (notification == null)
            throw new KeyNotFoundException($"Notification {request.NotificationId} not found");

        if (notification.UserId != request.UserId)
            throw new UnauthorizedAccessException("Cannot mark other user's notification as read");

        if (!notification.IsRead)
        {
            notification.MarkAsRead();
            await repository.UpdateAsync(notification, cancellationToken);
        }
    }
}
