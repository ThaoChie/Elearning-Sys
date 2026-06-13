using LMS.API.Extensions;
using LMS.Application.Features.Assignment.Commands;
using LMS.Domain.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.API.Controllers;

/// <summary>
/// Endpoint quản lý bài tập và nộp bài của sinh viên.
///
/// NGUYÊN TẮC BẢO MẬT CỐT LÕI:
/// - StudentId LUÔN được lấy từ JWT Claims qua ClaimsPrincipalExtensions.GetRequiredUserId(),
///   KHÔNG BAO GIỜ từ URL/Body.
/// - File được xác thực bằng magic bytes (không tin Content-Type header).
/// - File bị quét virus (ClamAV) trước khi lưu.
/// - File được đổi tên thành UUID ngẫu nhiên và mã hoá AES-256 trước khi lưu storage.
/// - Policy "StudentOnly": chỉ Student mới được nộp bài.
/// </summary>
[ApiController]
[Route("api/assignments")]
[Produces("application/json")]
[Authorize(Policy = AuthPolicies.StudentOnly)] // Chỉ Student được nộp bài
public sealed class AssignmentsController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Nộp bài tập (UC-13).
    ///
    /// Luồng bảo mật:
    ///   1. StudentId lấy từ JWT Claims.
    ///   2. Xác thực kích thước file &lt;= 50 MB (BR-18).
    ///   3. Xác thực MIME type bằng magic bytes (BR-17).
    ///   4. Quét virus ClamAV – từ chối nếu phát hiện malware.
    ///   5. Mã hoá AES-256-CBC.
    ///   6. Lưu vào Object Storage với UUID key ngẫu nhiên.
    ///   7. Ghi metadata vào database.
    /// </summary>
    /// <param name="id">ID bài tập (từ route).</param>
    /// <param name="file">File bài tập (multipart/form-data).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="201">Nộp bài thành công.</response>
    /// <response code="400">File không hợp lệ (kích thước, MIME type, validation).</response>
    /// <response code="401">Chưa xác thực hoặc token hết hạn.</response>
    /// <response code="404">Bài tập không tồn tại.</response>
    /// <response code="409">Sinh viên đã nộp bài này rồi (BR-16).</response>
    /// <response code="422">File chứa virus/malware hoặc MIME type bị giả mạo.</response>
    [HttpPost("{id}/submit")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(104_857_600)]          // Limit: 100 MB
    [RequestFormLimits(MultipartBodyLengthLimit = 104_857_600)]
    [ProducesResponseType(typeof(SubmitAssignmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Submit(
        string            id,
        IFormFile       file,
        CancellationToken ct)
    {
        if (!Guid.TryParse(id, out var parsedId))
        {
            return BadRequest(new { error = "invalid_id", message = "ID không hợp lệ." });
        }

        // ── 1. Lấy StudentId từ JWT Claims (IDOR prevention) ──────────────────
        // ClaimsPrincipalExtensions.GetRequiredUserId() đảm bảo luôn lấy từ "sub" claim.
        // TUYỆT ĐỐI KHÔNG lấy StudentId từ URL hay request body.
        Guid studentId;
        try { studentId = User.GetRequiredUserId(); }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = "invalid_token", message = ex.Message });
        }

        if (file is null || file.Length == 0)
            return BadRequest(new { error = "file_required", message = "Vui lòng chọn file bài tập." });

        var command = new SubmitAssignmentCommand
        {
            AssignmentId = parsedId,
            StudentId    = studentId,   // từ JWT Claims – KHÔNG từ body/URL
            File         = file
        };

        try
        {
            var result = await mediator.Send(command, ct);

            // HTTP 201 Created với Location header
            return CreatedAtAction(
                actionName:  null,
                value: new
                {
                    message          = "Nộp bài thành công.",
                    submissionId     = result.SubmissionId,
                    originalFileName = result.OriginalFileName,
                    mimeType         = result.MimeType,
                    fileSizeBytes    = result.FileSizeBytes,
                    submittedAt      = result.SubmittedAt,
                    storageKey       = result.StorageKey
                });
        }
        catch (KeyNotFoundException ex)
        {
            // Bài tập không tồn tại
            return NotFound(new { error = "assignment_not_found", message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-16: Đã nộp bài → 409 Conflict
            return Conflict(new { error = "already_submitted", message = ex.Message });
        }
        catch (FileSizeExceededException ex)
        {
            // BR-18: Quá 50 MB
            return BadRequest(new
            {
                error         = "file_too_large",
                message       = ex.Message,
                actualMb      = ex.ActualBytes / 1_048_576.0,
                maxMb         = ex.MaxBytes    / 1_048_576.0
            });
        }
        catch (InvalidMimeTypeException ex)
        {
            // BR-17: MIME type không hợp lệ (magic bytes)
            return UnprocessableEntity(new
            {
                error        = "invalid_mime_type",
                message      = ex.Message,
                detectedMime = ex.DetectedMime
            });
        }
        catch (VirusDetectedException ex)
        {
            // ClamAV phát hiện virus → từ chối và log
            return UnprocessableEntity(new
            {
                error     = "virus_detected",
                message   = ex.Message,
                virusName = ex.VirusName
            });
        }
    }

    /// <summary>
    /// Dummy GET endpoint to enforce Authentication policy before HTTP Method verification.
    /// </summary>
    [HttpGet("{id}/submit")]
    public IActionResult SubmitGet(string id) => StatusCode(StatusCodes.Status405MethodNotAllowed);
}
