using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using LMS.Application.Features.Auth.Commands;
using LMS.Application.Features.Auth.DTOs;
using LMS.Domain.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Đăng nhập và nhận Access Token (JWT RS256, 15 phút) + Refresh Token (UUID, 7 ngày).
    /// </summary>
    /// <remarks>
    /// Tài khoản sẽ bị khoá 15 phút sau 5 lần nhập sai mật khẩu liên tiếp.
    /// </remarks>
    /// <response code="200">Đăng nhập thành công, trả về token pair.</response>
    /// <response code="400">Dữ liệu đầu vào không hợp lệ (validation lỗi).</response>
    /// <response code="401">Email hoặc mật khẩu không đúng.</response>
    /// <response code="423">Tài khoản đang bị khoá tạm thời.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status423Locked)]
    public async Task<IActionResult> Login(
        [FromBody] LoginCommand command,
        CancellationToken ct)
    {
        try
        {
            var result = await mediator.Send(command, ct);
            return Ok(result);
        }
        catch (AccountLockedException ex)
        {
            return StatusCode(StatusCodes.Status423Locked, new
            {
                error     = "account_locked",
                message   = ex.Message,
                lockoutEnd = ex.LockoutEnd
            });
        }
        catch (InvalidCredentialsException ex)
        {
            return Unauthorized(new
            {
                error   = "invalid_credentials",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Cấp lại Access Token + Refresh Token mới (Rotation).
    /// Refresh Token cũ bị revoke ngay lập tức sau khi dùng.
    /// Phát hiện dùng lại token cũ → Thu hồi toàn bộ session.
    /// </summary>
    /// <response code="200">Token pair mới.</response>
    /// <response code="400">Refresh Token rỗng hoặc không hợp lệ.</response>
    /// <response code="401">Refresh Token đã hết hạn, bị revoke hoặc không tồn tại.</response>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshTokenCommand command,
        CancellationToken ct)
    {
        try
        {
            var result = await mediator.Send(command, ct);
            return Ok(result);
        }
        catch (InvalidTokenException ex)
        {
            return Unauthorized(new
            {
                error   = "invalid_token",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Đăng xuất: Đưa JTI của Access Token vào Redis Blacklist,
    /// đồng thời revoke Refresh Token trong DB.
    /// </summary>
    /// <remarks>
    /// Yêu cầu Bearer Token hợp lệ trong header Authorization.
    /// UserID được lấy từ JWT Claims (chống IDOR).
    /// </remarks>
    /// <response code="204">Đăng xuất thành công.</response>
    /// <response code="401">Access Token không hợp lệ hoặc đã hết hạn.</response>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        // ── Lấy thông tin từ JWT Claims – TUYỆT ĐỐI KHÔNG dùng request body/query ──
        var jti    = User.FindFirstValue(JwtRegisteredClaimNames.Jti);
        var subStr = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        var expStr = User.FindFirstValue(JwtRegisteredClaimNames.Exp);

        if (string.IsNullOrEmpty(jti) || string.IsNullOrEmpty(subStr))
            return Unauthorized(new { error = "invalid_token", message = "Token không chứa đủ claims." });

        if (!Guid.TryParse(subStr, out var userId))
            return Unauthorized(new { error = "invalid_token", message = "Subject claim không hợp lệ." });

        // Parse exp claim (Unix timestamp) → DateTime
        var expiry = long.TryParse(expStr, out var expUnix)
            ? DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime
            : DateTime.UtcNow.AddMinutes(15); // fallback an toàn

        var command = new LogoutCommand(userId, jti, expiry);
        await mediator.Send(command, ct);

        return NoContent();
    }
}
