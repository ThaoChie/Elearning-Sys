using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using LMS.Domain.Exceptions;
using LMS.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.API.Controllers;

/// <summary>
/// Quản lý cài đặt bảo mật trong Hồ sơ cá nhân của người dùng.
/// Tất cả các endpoint đều yêu cầu xác thực (Bearer JWT).
/// UserID luôn được lấy từ JWT Claims — TUYỆT ĐỐI KHÔNG lấy từ request body hay URL.
/// </summary>
[ApiController]
[Route("api/profile")]
[Authorize]
[Produces("application/json")]
public sealed class ProfileController(IProfileService profileService) : ControllerBase
{
    // ── Helper: lấy UserId từ JWT Claims ────────────────────────────────────
    private bool TryGetUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var subStr = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return !string.IsNullOrEmpty(subStr) && Guid.TryParse(subStr, out userId);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  GET /api/profile/security/2fa
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Lấy trạng thái 2FA hiện tại của người dùng đang đăng nhập.
    /// </summary>
    /// <response code="200">Trạng thái 2FA.</response>
    /// <response code="401">Chưa xác thực.</response>
    [HttpGet("security/2fa")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTwoFactorStatus(CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(new { error = "invalid_token", message = "Token không chứa Sub claim hợp lệ." });

        try
        {
            var isEnabled = await profileService.GetTwoFactorStatusAsync(userId, ct);
            return Ok(new { twoFactorEnabled = isEnabled });
        }
        catch (UserNotFoundException ex)
        {
            return NotFound(new { error = "user_not_found", message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  GET /api/profile/security/2fa/setup
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Sinh mã bí mật và cấu hình để bật 2FA bằng Google Authenticator.</summary>
    [HttpGet("security/2fa/setup")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SetupTwoFactor(CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(new { error = "invalid_token", message = "Token không chứa Sub claim hợp lệ." });

        try
        {
            var (secret, uri) = await profileService.GenerateTwoFactorSetupAsync(userId, ct);
            return Ok(new { secret, qrCodeUri = uri });
        }
        catch (UserNotFoundException ex)
        {
            return NotFound(new { error = "user_not_found", message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  POST /api/profile/security/2fa/verify
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Xác thực mã 6 số để chính thức bật 2FA.</summary>
    [HttpGet("security/2fa/verify")]
    [ProducesResponseType(StatusCodes.Status405MethodNotAllowed)]
    public IActionResult VerifyTwoFactorGet() => StatusCode(StatusCodes.Status405MethodNotAllowed);

    [HttpPost("security/2fa/verify")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyTwoFactor(
        [FromBody] VerifyTwoFactorRequest request,
        CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(new { error = "invalid_token", message = "Token không chứa Sub claim hợp lệ." });

        try
        {
            var isValid = await profileService.VerifyAndEnableTwoFactorAsync(userId, request.Code, ct);
            if (isValid)
            {
                return Ok(new { message = "Đã bật xác thực 2 yếu tố (2FA) thành công." });
            }
            return BadRequest(new { error = "invalid_code", message = "Mã xác thực không đúng hoặc đã hết hạn." });
        }
        catch (UserNotFoundException ex)
        {
            return NotFound(new { error = "user_not_found", message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  DELETE /api/profile/security/2fa
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Tắt xác thực 2 yếu tố (2FA).</summary>
    [HttpDelete("security/2fa")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DisableTwoFactor(CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(new { error = "invalid_token", message = "Token không chứa Sub claim hợp lệ." });

        try
        {
            await profileService.DisableTwoFactorAsync(userId, ct);
            return Ok(new { message = "Đã tắt xác thực 2 yếu tố (2FA)." });
        }
        catch (UserNotFoundException ex)
        {
            return NotFound(new { error = "user_not_found", message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  PUT /api/profile/security/password
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Đổi mật khẩu của người dùng hiện tại.
    /// Yêu cầu mật khẩu hiện tại phải đúng.
    /// </summary>
    /// <response code="200">Đổi mật khẩu thành công.</response>
    /// <response code="400">Sai mật khẩu hiện tại hoặc request không hợp lệ.</response>
    /// <response code="401">Chưa xác thực.</response>
    [HttpPut("security/password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(new { error = "invalid_token", message = "Token không chứa Sub claim hợp lệ." });

        try
        {
            await profileService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword, ct);
            return Ok(new { message = "Đổi mật khẩu thành công." });
        }
        catch (UserNotFoundException ex)
        {
            return NotFound(new { error = "user_not_found", message = ex.Message });
        }
        catch (InvalidCredentialsException ex)
        {
            return BadRequest(new { error = "invalid_credentials", message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "invalid_request", message = ex.Message });
        }
    }
}

// ── Request DTO ──────────────────────────────────────────────────────────────

/// <summary>Request body cho endpoint verify 2FA.</summary>
public sealed record VerifyTwoFactorRequest(
    string Code
);

/// <summary>Request body cho endpoint đổi mật khẩu.</summary>
public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);
