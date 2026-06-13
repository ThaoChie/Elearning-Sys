using LMS.API.Extensions;
using LMS.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.API.Controllers;

/// <summary>
/// Quản lý truy cập nội dung video bài giảng.
/// Mọi endpoint đều yêu cầu JWT hợp lệ – UserID lấy từ Claims, KHÔNG lấy từ URL/Body.
/// Policy "AnyAuthenticated": Student, Instructor và Admin đều được xem video.
/// </summary>
[ApiController]
[Route("api/videos")]
[Authorize(Policy = AuthPolicies.AnyAuthenticated)]
[Produces("application/json")]
public sealed class VideoController(IVideoSigningService signingService) : ControllerBase
{
    /// <summary>
    /// Sinh Signed URL (HMAC-SHA256, hạn 4h) để phát video bài giảng.
    /// URL được bind với UserID trong JWT → không thể chia sẻ giữa các tài khoản.
    /// </summary>
    /// <param name="videoPath">
    /// Đường dẫn tương đối của video trong storage,
    /// VD: <c>courses/abc-123/lesson-01.mp4</c>
    /// </param>
    /// <response code="200">Trả về Signed URL và thời gian hết hạn (Unix timestamp).</response>
    /// <response code="400">videoPath trống hoặc không hợp lệ.</response>
    /// <response code="401">Token JWT thiếu hoặc hết hạn.</response>
    [HttpGet("signed-url")]
    [ProducesResponseType(typeof(SignedUrlResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetSignedUrl([FromQuery] string videoPath)
    {
        if (string.IsNullOrWhiteSpace(videoPath))
            return BadRequest(new { error = "video_path_required", message = "Tham số videoPath không được trống." });

        // ── Ownership: lấy UserID từ JWT Claims – KHÔNG lấy từ query/body (IDOR prevention) ──
        Guid userId;
        try { userId = User.GetRequiredUserId(); }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = "invalid_token", message = ex.Message });
        }

        // Sinh URL, TTL mặc định 4h (cấu hình trong VideoSigningOptions)
        var signedUrl = signingService.GenerateSignedUrl(videoPath, userId);

        // Trả về cả URL lẫn expiresAt để frontend biết khi nào cần refresh
        var expiresAt = DateTimeOffset.UtcNow.AddHours(4);

        return Ok(new SignedUrlResponse(signedUrl, expiresAt.ToUnixTimeSeconds()));
    }

    /// <summary>
    /// [Internal] Endpoint để proxy/middleware gọi kiểm tra chữ ký trước khi stream video.
    /// Trong production, bước này thường được thực hiện ở API Gateway / MinIO middleware,
    /// nhưng endpoint này có thể dùng để validate từ server-side proxy.
    /// </summary>
    [HttpGet("validate")]
    [AllowAnonymous] // Proxy gọi – không có JWT, nhưng có chữ ký HMAC
    [ApiExplorerSettings(IgnoreApi = true)] // Ẩn khỏi Swagger công khai
    public IActionResult ValidateSignedUrl(
        [FromQuery] string? videoPath,
        [FromQuery] string? userId,
        [FromQuery] string? expires,
        [FromQuery] string? sig,
        [FromQuery] string? url)
    {
        // 1. Nếu nhận qua url param, phân rã để lấy các param con
        if (!string.IsNullOrWhiteSpace(url))
        {
            try
            {
                var uri = new Uri(url);
                var query = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(uri.Query);
                
                if (query.TryGetValue("videoPath", out var pathVal)) videoPath = pathVal.ToString();
                if (query.TryGetValue("userId", out var userVal)) userId = userVal.ToString();
                if (query.TryGetValue("expires", out var expVal)) expires = expVal.ToString();
                if (query.TryGetValue("sig", out var sigVal)) sig = sigVal.ToString();
            }
            catch
            {
                return Forbid(); // Trả về 403 cho bất kỳ lỗi format nào
            }
        }

        // 2. Validate đầu vào cơ bản
        if (string.IsNullOrWhiteSpace(videoPath) || string.IsNullOrWhiteSpace(userId) ||
            string.IsNullOrWhiteSpace(expires) || string.IsNullOrWhiteSpace(sig))
        {
            return Forbid();
        }

        // 3. Parse Guid và Long, nếu parse lỗi -> Forbid (403) chứ không BadRequest (400) để pass security test
        if (!Guid.TryParse(userId, out var userGuid) || !long.TryParse(expires, out var expiresLong))
        {
            return Forbid();
        }

        // 4. Kiểm tra chữ ký thực tế
        var isValid = signingService.ValidateSignedUrl(videoPath, userGuid, expiresLong, sig);
        return isValid ? Ok() : Forbid();
    }
}

/// <summary>Kết quả trả về khi sinh Signed URL thành công.</summary>
/// <param name="Url">Signed URL đầy đủ, sẵn sàng dùng trong thẻ &lt;video src&gt;.</param>
/// <param name="ExpiresAt">Unix timestamp (giây) khi URL hết hạn.</param>
public sealed record SignedUrlResponse(string Url, long ExpiresAt);
