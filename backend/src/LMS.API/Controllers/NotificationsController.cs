using LMS.API.Extensions;
using LMS.Application.Notifications;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.API.Controllers;

/// <summary>
/// NotificationsController — Quản lý thông báo cho người dùng đang đăng nhập.
///
/// Phân quyền: AnyAuthenticated (Student / Instructor / Admin).
/// UserId luôn lấy từ JWT Claims (chống IDOR — người dùng chỉ thấy thông báo của mình).
///
/// Route: /api/notifications
/// </summary>
[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController(IMediator mediator) : ControllerBase
{
    // ════════════════════════════════════════════════════════════════════════
    //  GET /api/notifications
    //  F-N01: Lấy danh sách thông báo của user đang đăng nhập.
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Lấy danh sách thông báo. Hỗ trợ lọc chỉ thông báo chưa đọc.
    /// </summary>
    /// <param name="limit">Số lượng tối đa (mặc định 50, tối đa 100).</param>
    /// <param name="unreadOnly">true = chỉ lấy thông báo chưa đọc.</param>
    [HttpGet]
    [ProducesResponseType(typeof(List<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyNotifications(
        [FromQuery] int limit = 50,
        [FromQuery] bool unreadOnly = false,
        CancellationToken ct = default)
    {
        try
        {
            // Giới hạn tối đa 100 để tránh query quá nặng
            limit = Math.Clamp(limit, 1, 100);

            var userId        = User.GetRequiredUserId();
            var notifications = await mediator.Send(
                new GetMyNotificationsQuery(userId, limit, unreadOnly), ct);

            return Ok(notifications);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = "unauthorized", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  PATCH /api/notifications/{id}/read
    //  F-N02: Đánh dấu một thông báo đã đọc.
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Đánh dấu một thông báo cụ thể là đã đọc.
    /// Chỉ owner của thông báo mới được đánh dấu (kiểm tra trong handler).
    /// </summary>
    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        try
        {
            var userId = User.GetRequiredUserId();
            await mediator.Send(new MarkNotificationAsReadCommand(userId, id), ct);
            return Ok(new { message = "Đã đánh dấu thông báo là đã đọc." });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "not_found", message = "Không tìm thấy thông báo." });
        }
        catch (UnauthorizedAccessException)
        {
            // Trả 404 thay vì 403 để tránh lộ sự tồn tại của notification
            return NotFound(new { error = "not_found", message = "Không tìm thấy thông báo." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  POST /api/notifications/mark-all-read
    //  F-N03: Đánh dấu tất cả thông báo của user là đã đọc.
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Đánh dấu TẤT CẢ thông báo chưa đọc của user là đã đọc.
    /// </summary>
    [HttpPost("mark-all-read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        try
        {
            var userId = User.GetRequiredUserId();
            await mediator.Send(new MarkAllAsReadCommand(userId), ct);
            return Ok(new { message = "Đã đánh dấu tất cả thông báo là đã đọc." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = "unauthorized", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  GET /api/notifications/unread-count
    //  Tiện ích cho NotificationDropdown — chỉ lấy số lượng chưa đọc.
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Lấy số lượng thông báo chưa đọc. Dùng cho badge trên header.
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        try
        {
            var userId        = User.GetRequiredUserId();
            var notifications = await mediator.Send(
                new GetMyNotificationsQuery(userId, 100, UnreadOnly: true), ct);
            return Ok(new { unreadCount = notifications.Count });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = "unauthorized", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }
}
