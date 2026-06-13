using LMS.API.Extensions;
using LMS.Application.Features.Exam.Commands;
using LMS.Application.Features.Exam.DTOs;
using LMS.Domain.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.API.Controllers;

/// <summary>
/// Controller xử lý logic chống gian lận trong phiên thi.
///
/// NGUYÊN TẮC BẢO MẬT CỐT LÕI:
/// - UserId LUÔN được lấy từ JWT Claims qua ClaimsPrincipalExtensions.GetRequiredUserId(),
///   KHÔNG BAO GIỜ từ URL/Body.
/// - Mọi tính toán thời gian được thực hiện server-side trong Handler.
/// - Client chỉ gửi ExamId (route) và ViolationType (body) – không gửi TimeRemaining.
/// - Policy "StudentOnly": chỉ Student mới được thi (Instructor/Admin không thi).
/// </summary>
[ApiController]
[Route("api/exam")]
[Produces("application/json")]
[Authorize(Policy = AuthPolicies.StudentOnly)] // Chỉ Student được phép thi
public sealed class ExamController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Heartbeat đồng bộ trạng thái phiên thi (gọi mỗi 30 giây từ client).
    /// Server kiểm tra timer và trả về thời gian còn lại (tính server-side).
    /// </summary>
    /// <param name="id">ID bài thi (exam).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Thời gian còn lại và trạng thái phiên thi.</returns>
    /// <response code="200">Phiên thi hợp lệ, trả về thời gian còn lại.</response>
    /// <response code="400">Hết giờ – phiên đã bị đánh dấu Violated.</response>
    /// <response code="401">Chưa xác thực hoặc token hết hạn.</response>
    /// <response code="404">Không tìm thấy phiên thi đang active cho user này.</response>
    [HttpPost("{id}/heartbeat")]
    [ProducesResponseType(typeof(HeartbeatResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Heartbeat(string id, CancellationToken ct)
    {
        if (!Guid.TryParse(id, out var parsedId))
        {
            return BadRequest(new { error = "invalid_id", message = "ID không hợp lệ." });
        }

        // ── Extract UserId từ JWT Claims (IDOR prevention) ────────────────────
        // ClaimsPrincipalExtensions.GetRequiredUserId() đảm bảo luôn lấy từ "sub" claim.
        // TUYỆT ĐỐI KHÔNG dùng `id` route hay bất kỳ input nào từ client làm UserId.
        Guid userId;
        try { userId = User.GetRequiredUserId(); }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = "invalid_token", message = ex.Message });
        }

        try
        {
            // ExamId từ route, UserId từ Claims – KHÔNG từ body
            var result = await mediator.Send(new HeartbeatCommand(parsedId, userId), ct);
            return Ok(result);
        }
        catch (ExamTimeExpiredException ex)
        {
            // HTTP 400: hết giờ – phiên đã bị Violated
            return BadRequest(new
            {
                error   = "exam_time_expired",
                message = ex.Message,
                sessionId = ex.SessionId
            });
        }
        catch (ExamSessionNotFoundException)
        {
            return NotFound(new
            {
                error   = "session_not_found",
                message = "Không tìm thấy phiên thi đang hoạt động."
            });
        }
    }

    /// <summary>
    /// Báo cáo vi phạm (tab-switch, thoát fullscreen…).
    /// Server tự quản lý ViolationCount – client KHÔNG gửi số lần vi phạm.
    /// Nếu tổng vi phạm &gt;= 3 → Force Submit tự động (HTTP 200 với IsForceSubmitted=true).
    /// </summary>
    /// <param name="id">ID bài thi (exam).</param>
    /// <param name="request">Chỉ chứa ViolationType (label cho audit log).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="200">Vi phạm đã ghi nhận. Kiểm tra IsForceSubmitted để biết bài có bị nộp không.</response>
    /// <response code="400">
    /// Hết giờ (exam_time_expired) HOẶC đã Force Submit (exam_force_submitted)
    /// – dùng field "error" để phân biệt.
    /// </response>
    /// <response code="401">Chưa xác thực.</response>
    /// <response code="404">Không tìm thấy phiên thi đang active.</response>
    [HttpPost("{id}/violation")]
    [ProducesResponseType(typeof(ViolationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReportViolation(
        string id,
        [FromBody] ViolationRequest request,
        CancellationToken ct)
    {
        if (!Guid.TryParse(id, out var parsedId))
        {
            return BadRequest(new { error = "invalid_id", message = "ID không hợp lệ." });
        }

        Guid userId;
        try { userId = User.GetRequiredUserId(); }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = "invalid_token", message = ex.Message });
        }

        try
        {
            // ViolationType từ body (chỉ để audit log), ViolationCount do server tự quản lý
            var command = new ReportViolationCommand(parsedId, userId, request.ViolationType);
            var result = await mediator.Send(command, ct);
            return Ok(result);
        }
        catch (ExamForceSubmittedException ex)
        {
            // HTTP 400: vi phạm đủ 3 lần → Force Submit
            return BadRequest(new
            {
                error          = "exam_force_submitted",
                message        = ex.Message,
                sessionId      = ex.SessionId,
                violationCount = ex.ViolationCount
            });
        }
        catch (ExamTimeExpiredException ex)
        {
            return BadRequest(new
            {
                error     = "exam_time_expired",
                message   = ex.Message,
                sessionId = ex.SessionId
            });
        }
        catch (ExamSessionNotFoundException)
        {
            return NotFound(new
            {
                error   = "session_not_found",
                message = "Không tìm thấy phiên thi đang hoạt động."
            });
        }
    }

}

/// <summary>
/// Request body cho endpoint violation.
/// CHỈ chứa ViolationType (label audit log).
/// KHÔNG chứa ViolationCount hay TimeRemaining – server tự quản lý.
/// </summary>
/// <param name="ViolationType">
/// Loại vi phạm: "TabSwitch" | "FullscreenExit" | "CopyAttempt" | "RightClickAttempt".
/// </param>
public sealed record ViolationRequest(string ViolationType);
