using LMS.Domain.Interfaces;
using MediatR;

namespace LMS.Application.Notifications;

public record GetMyNotificationsQuery(Guid UserId, int Limit = 50, bool UnreadOnly = false) : IRequest<List<NotificationDto>>;

public class GetMyNotificationsQueryHandler(INotificationRepository repository) 
    : IRequestHandler<GetMyNotificationsQuery, List<NotificationDto>>
{
    public async Task<List<NotificationDto>> Handle(GetMyNotificationsQuery request, CancellationToken cancellationToken)
    {
        var notifications = await repository.GetByUserIdAsync(request.UserId, request.Limit, request.UnreadOnly, cancellationToken);
        return notifications.Select(NotificationDto.FromEntity).ToList();
    }
}
