namespace LMS.Application.Features.Quiz.DTOs;

// ── Quiz Responses ────────────────────────────────────────────────────────────

/// <summary>
/// Summary của một đề thi — dùng trong danh sách (GET /api/quiz).
/// </summary>
public sealed class QuizSummaryResponse
{
    public Guid    Id               { get; init; }
    public string  Title            { get; init; } = string.Empty;
    public Guid    CourseId         { get; init; }
    public string  CourseName       { get; init; } = string.Empty;
    public int     DurationMinutes  { get; init; }
    public bool    AntiCheatEnabled { get; init; }
    public int     QuestionCount    { get; init; }
    public string  Status           { get; init; } = "Active"; // Active | Ended | Scheduled
    public DateTime? StartAt        { get; init; }
    public DateTime? EndAt          { get; init; }
    public DateTime CreatedAt       { get; init; }
}

/// <summary>
/// Chi tiết đề thi kèm danh sách câu hỏi — dùng cho Instructor/Admin (GET /api/quiz/{id}).
/// IsCorrect ĐƯỢC trả về cho Instructor/Admin (khác với endpoint Student).
/// </summary>
public sealed class QuizDetailResponse
{
    public Guid    Id               { get; init; }
    public string  Title            { get; init; } = string.Empty;
    public Guid    CourseId         { get; init; }
    public string  CourseName       { get; init; } = string.Empty;
    public int     DurationMinutes  { get; init; }
    public bool    AntiCheatEnabled { get; init; }
    public DateTime? StartAt        { get; init; }
    public DateTime? EndAt          { get; init; }
    public DateTime CreatedAt       { get; init; }

    /// <summary>Danh sách câu hỏi theo thứ tự Order (không xáo trộn — Instructor view).</summary>
    public List<QuestionDetailResponse> Questions { get; init; } = [];
}

/// <summary>
/// Chi tiết một câu hỏi — kèm đáp án (IsCorrect hiển thị cho Instructor).
/// </summary>
public sealed class QuestionDetailResponse
{
    public Guid   Id      { get; init; }
    public string Content { get; init; } = string.Empty;
    public int    Order   { get; init; }
    public DateTime CreatedAt { get; init; }

    /// <summary>Đáp án, sắp xếp theo Order. IsCorrect có mặt trong response này.</summary>
    public List<AnswerDetailResponse> Answers { get; init; } = [];
}

/// <summary>
/// Đáp án trong context Instructor — có IsCorrect.
/// </summary>
public sealed class AnswerDetailResponse
{
    public Guid   Id        { get; init; }
    public string Content   { get; init; } = string.Empty;
    /// <summary>Key hiển thị A, B, C, D...</summary>
    public string Key       { get; init; } = string.Empty;
    public bool   IsCorrect { get; init; }
    public int    Order     { get; init; }
}

/// <summary>
/// Response sau khi tạo hoặc cập nhật câu hỏi thành công.
/// </summary>
public sealed class QuestionCreatedResponse
{
    public Guid   Id      { get; init; }
    public string Content { get; init; } = string.Empty;
    public int    Order   { get; init; }
    public int    TotalAnswers { get; init; }
}
