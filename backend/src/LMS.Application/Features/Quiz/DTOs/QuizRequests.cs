using System.ComponentModel.DataAnnotations;

namespace LMS.Application.Features.Quiz.DTOs;

// ── Quiz CRUD Requests ────────────────────────────────────────────────────────

/// <summary>
/// Request tạo đề thi mới. CourseId phải là khoá học của Instructor đang đăng nhập.
/// </summary>
public sealed class CreateQuizRequest
{
    [Required(ErrorMessage = "CourseId là bắt buộc.")]
    public Guid CourseId { get; init; }

    [Required(ErrorMessage = "Tiêu đề đề thi là bắt buộc.")]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Tiêu đề phải từ 3 đến 200 ký tự.")]
    public string Title { get; init; } = string.Empty;

    [Range(1, 600, ErrorMessage = "Thời gian làm bài phải từ 1 đến 600 phút.")]
    public int DurationMinutes { get; init; } = 60;

    public bool AntiCheatEnabled { get; init; } = true;
}

/// <summary>
/// Request cập nhật metadata đề thi. Tất cả field đều optional (PATCH semantics).
/// </summary>
public sealed class UpdateQuizRequest
{
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Tiêu đề phải từ 3 đến 200 ký tự.")]
    public string? Title { get; init; }

    [Range(1, 600, ErrorMessage = "Thời gian làm bài phải từ 1 đến 600 phút.")]
    public int? DurationMinutes { get; init; }

    public bool? AntiCheatEnabled { get; init; }

    /// <summary>UTC. Nếu null thì không có giới hạn thời gian bắt đầu.</summary>
    public DateTime? StartAt { get; init; }

    /// <summary>UTC. Nếu null thì không có giới hạn thời gian kết thúc.</summary>
    public DateTime? EndAt { get; init; }
}

// ── Question CRUD Requests ────────────────────────────────────────────────────

/// <summary>
/// Request thêm hoặc cập nhật câu hỏi và toàn bộ đáp án của nó.
/// Khi UPDATE, toàn bộ danh sách Answers sẽ bị replace (delete-and-recreate).
/// </summary>
public sealed class UpsertQuestionRequest
{
    [Required(ErrorMessage = "Nội dung câu hỏi là bắt buộc.")]
    [StringLength(2000, MinimumLength = 5, ErrorMessage = "Câu hỏi phải từ 5 đến 2000 ký tự.")]
    public string Content { get; init; } = string.Empty;

    [Required(ErrorMessage = "Danh sách đáp án là bắt buộc.")]
    [MinLength(2, ErrorMessage = "Câu hỏi phải có ít nhất 2 đáp án.")]
    [MaxLength(6, ErrorMessage = "Câu hỏi không được có quá 6 đáp án.")]
    public List<AnswerRequest> Answers { get; init; } = [];
}

/// <summary>
/// Một đáp án trong câu hỏi.
/// </summary>
public sealed class AnswerRequest
{
    [Required(ErrorMessage = "Nội dung đáp án là bắt buộc.")]
    [StringLength(1000, MinimumLength = 1, ErrorMessage = "Đáp án phải từ 1 đến 1000 ký tự.")]
    public string Content { get; init; } = string.Empty;

    /// <summary>Đánh dấu đây là đáp án đúng. Ít nhất 1 đáp án trong câu hỏi phải IsCorrect = true.</summary>
    public bool IsCorrect { get; init; }
}

/// <summary>
/// Request reorder toàn bộ câu hỏi trong một đề thi (dùng cho drag-drop trong ExamBuilder).
/// </summary>
public sealed class ReorderQuestionsRequest
{
    /// <summary>
    /// Danh sách QuestionId theo thứ tự mong muốn mới.
    /// Phải chứa đúng tất cả câu hỏi hiện có của quiz (không thêm, không bớt).
    /// </summary>
    [Required]
    [MinLength(1, ErrorMessage = "Phải có ít nhất 1 câu hỏi để reorder.")]
    public List<Guid> OrderedQuestionIds { get; init; } = [];
}
