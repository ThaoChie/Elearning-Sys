using LMS.Domain.Interfaces;
using MediatR;

namespace LMS.Application.Notifications;

public record MarkAllAsReadCommand(Guid UserId) : IRequest;

public class MarkAllAsReadCommandHandler(INotificationRepository repository) 
    : IRequestHandler<MarkAllAsReadCommand>
{
    public async Task Handle(MarkAllAsReadCommand request, CancellationToken cancellationToken)
    {
        var unreadNotifications = await repository.GetUnreadByUserIdAsync(request.UserId, cancellationToken);

        if (unreadNotifications.Any())
        {
            foreach (var notification in unreadNotifications)
            {
                notification.MarkAsRead();
            }
            await repository.UpdateRangeAsync(unreadNotifications, cancellationToken);
        }
    }
}
