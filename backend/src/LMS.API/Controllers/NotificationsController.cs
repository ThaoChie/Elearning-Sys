using LMS.API.Extensions;
using LMS.Application.Notifications;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetMyNotifications(
        [FromQuery] int limit = 50,
        [FromQuery] bool unreadOnly = false)
    {
        var userId = User.GetRequiredUserId();
        var notifications = await mediator.Send(new GetMyNotificationsQuery(userId, limit, unreadOnly));
        return Ok(notifications);
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = User.GetRequiredUserId();
        await mediator.Send(new MarkNotificationAsReadCommand(userId, id));
        return NoContent();
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = User.GetRequiredUserId();
        await mediator.Send(new MarkAllAsReadCommand(userId));
        return NoContent();
    }
}
