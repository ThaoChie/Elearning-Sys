using LMS.API.Extensions;
using LMS.Application.Features.Quiz.DTOs;
using LMS.Application.Features.Quiz.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.API.Controllers;

/// <summary>
/// QuizController — Quản lý Đề thi (Quiz) và Câu hỏi (Question/Answer) cho ExamBuilder.
///
/// Phân quyền: InstructorOrAdmin.
///   - Instructor: chỉ xem/sửa quiz thuộc course mình phụ trách.
///   - Admin: toàn quyền.
///
/// Security:
///   - UserId, Role luôn được lấy từ JWT Claims (chống IDOR).
///   - IsCorrect trong đáp án được trả về cho Instructor/Admin (không cho Student).
///   - IsCorrect KHÔNG bao giờ xuất hiện trong response gửi cho Student (endpoint Student nằm ở ExamController).
///
/// Route base: /api/quiz
/// </summary>
[ApiController]
[Route("api/quiz")]
[Authorize(Policy = AuthPolicies.InstructorOrAdmin)]
public sealed class QuizController(IQuizService quizService) : ControllerBase
{
    // ════════════════════════════════════════════════════════════════════════
    //  QUIZ ENDPOINTS
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// GET /api/quiz
    /// Lấy danh sách đề thi.
    /// - Instructor: chỉ thấy quiz thuộc course mình.
    /// - Admin: thấy tất cả.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<QuizSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQuizzes(CancellationToken ct)
    {
        try
        {
            var actorId = User.GetRequiredUserId();
            var isAdmin = User.IsAdmin();

            var result = await quizService.GetQuizzesAsync(actorId, isAdmin, ct);
            return Ok(result);
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

    /// <summary>
    /// GET /api/quiz/{id}
    /// Lấy chi tiết đề thi kèm toàn bộ câu hỏi và đáp án (kèm IsCorrect cho Instructor/Admin).
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(QuizDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetQuiz(Guid id, CancellationToken ct)
    {
        try
        {
            var actorId = User.GetRequiredUserId();
            var isAdmin = User.IsAdmin();

            var result = await quizService.GetQuizDetailAsync(id, actorId, isAdmin, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "not_found", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = "forbidden", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/quiz
    /// Tạo đề thi mới cho một khoá học.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(QuizSummaryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateQuiz([FromBody] CreateQuizRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "validation_error", details = ModelState });

        try
        {
            var actorId = User.GetRequiredUserId();
            var isAdmin = User.IsAdmin();

            var result = await quizService.CreateQuizAsync(request, actorId, isAdmin, ct);
            return Created($"/api/quiz/{result.Id}", result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "not_found", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = "forbidden", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/quiz/{id}
    /// Cập nhật metadata đề thi (PATCH semantics — chỉ update field không null).
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateQuiz(Guid id, [FromBody] UpdateQuizRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "validation_error", details = ModelState });

        try
        {
            var actorId = User.GetRequiredUserId();
            var isAdmin = User.IsAdmin();

            await quizService.UpdateQuizAsync(id, request, actorId, isAdmin, ct);
            return Ok(new { message = "Cập nhật đề thi thành công." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "not_found", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = "forbidden", message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "validation_error", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    /// <summary>
    /// DELETE /api/quiz/{id}
    /// Xóa đề thi và toàn bộ câu hỏi/đáp án.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteQuiz(Guid id, CancellationToken ct)
    {
        try
        {
            var actorId = User.GetRequiredUserId();
            var isAdmin = User.IsAdmin();

            await quizService.DeleteQuizAsync(id, actorId, isAdmin, ct);
            return Ok(new { message = "Đã xóa đề thi." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "not_found", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = "forbidden", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  QUESTION ENDPOINTS
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// GET /api/quiz/{quizId}/questions
    /// Lấy danh sách câu hỏi của đề thi theo thứ tự Order.
    /// Đây là endpoint chính mà ExamBuilder Frontend gọi.
    /// Response bao gồm IsCorrect (vì caller là Instructor/Admin).
    /// </summary>
    [HttpGet("{quizId:guid}/questions")]
    [ProducesResponseType(typeof(IReadOnlyList<QuestionDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuestions(Guid quizId, CancellationToken ct)
    {
        try
        {
            var actorId = User.GetRequiredUserId();
            var isAdmin = User.IsAdmin();

            var result = await quizService.GetQuestionsAsync(quizId, actorId, isAdmin, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "not_found", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = "forbidden", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/quiz/{quizId}/questions
    /// Thêm câu hỏi mới vào đề thi kèm danh sách đáp án.
    /// Order được gán tự động = tổng câu hỏi hiện có + 1.
    /// </summary>
    [HttpPost("{quizId:guid}/questions")]
    [ProducesResponseType(typeof(QuestionCreatedResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddQuestion(Guid quizId, [FromBody] UpsertQuestionRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "validation_error", details = ModelState });

        try
        {
            var actorId = User.GetRequiredUserId();
            var isAdmin = User.IsAdmin();

            var result = await quizService.AddQuestionAsync(quizId, request, actorId, isAdmin, ct);
            return Created($"/api/quiz/{quizId}/questions/{result.Id}", result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "not_found", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = "forbidden", message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "validation_error", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/quiz/{quizId}/questions/{questionId}
    /// Cập nhật nội dung câu hỏi và replace toàn bộ đáp án.
    /// </summary>
    [HttpPut("{quizId:guid}/questions/{questionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateQuestion(
        Guid quizId, Guid questionId,
        [FromBody] UpsertQuestionRequest request,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "validation_error", details = ModelState });

        try
        {
            var actorId = User.GetRequiredUserId();
            var isAdmin = User.IsAdmin();

            await quizService.UpdateQuestionAsync(quizId, questionId, request, actorId, isAdmin, ct);
            return Ok(new { message = "Cập nhật câu hỏi thành công." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "not_found", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = "forbidden", message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "validation_error", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    /// <summary>
    /// DELETE /api/quiz/{quizId}/questions/{questionId}
    /// Xóa câu hỏi và toàn bộ đáp án. Tự động re-number Order các câu còn lại.
    /// </summary>
    [HttpDelete("{quizId:guid}/questions/{questionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteQuestion(Guid quizId, Guid questionId, CancellationToken ct)
    {
        try
        {
            var actorId = User.GetRequiredUserId();
            var isAdmin = User.IsAdmin();

            await quizService.DeleteQuestionAsync(quizId, questionId, actorId, isAdmin, ct);
            return Ok(new { message = "Đã xóa câu hỏi." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "not_found", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = "forbidden", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/quiz/{quizId}/questions/reorder
    /// Sắp xếp lại thứ tự câu hỏi (drag-and-drop trong ExamBuilder).
    /// Body: { "orderedQuestionIds": ["guid1", "guid2", "guid3"] }
    /// </summary>
    [HttpPut("{quizId:guid}/questions/reorder")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReorderQuestions(
        Guid quizId,
        [FromBody] ReorderQuestionsRequest request,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "validation_error", details = ModelState });

        try
        {
            var actorId = User.GetRequiredUserId();
            var isAdmin = User.IsAdmin();

            await quizService.ReorderQuestionsAsync(quizId, request, actorId, isAdmin, ct);
            return Ok(new { message = "Đã cập nhật thứ tự câu hỏi." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "not_found", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = "forbidden", message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "validation_error", message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "internal_error", message = ex.Message });
        }
    }
}
