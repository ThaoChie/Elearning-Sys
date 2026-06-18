using LMS.Application.Features.Quiz.DTOs;

namespace LMS.Application.Features.Quiz.Services;

/// <summary>
/// Interface định nghĩa business logic cho quản lý Đề thi (Quiz) và Câu hỏi (Question).
///
/// NGUYÊN TẮC BẢO MẬT:
///   - actorId: Guid của Instructor/Admin lấy từ JWT Claims — KHÔNG từ URL/Body.
///   - isAdmin: lấy từ JWT Role claim — KHÔNG từ Body.
///   - Mọi phương thức đọc/ghi đều kiểm tra ownership trước khi thực thi.
///   - IsCorrect trong Answer KHÔNG bao giờ lộ ra Response dành cho Student.
/// </summary>
public interface IQuizService
{
    // ── Quiz CRUD ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Lấy danh sách đề thi.
    /// - Instructor: chỉ thấy quiz thuộc course mình phụ trách.
    /// - Admin: thấy tất cả.
    /// </summary>
    Task<IReadOnlyList<QuizSummaryResponse>> GetQuizzesAsync(
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    /// <summary>
    /// Lấy chi tiết một đề thi kèm toàn bộ câu hỏi (theo thứ tự Order, KHÔNG xáo trộn).
    /// IsCorrect được trả về vì caller là Instructor/Admin.
    /// </summary>
    /// <exception cref="KeyNotFoundException">Quiz không tồn tại.</exception>
    /// <exception cref="UnauthorizedAccessException">Instructor không phải chủ sở hữu quiz.</exception>
    Task<QuizDetailResponse> GetQuizDetailAsync(
        Guid quizId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    /// <summary>
    /// Tạo đề thi mới cho một khoá học.
    /// </summary>
    /// <exception cref="KeyNotFoundException">Course không tồn tại.</exception>
    /// <exception cref="UnauthorizedAccessException">Instructor không phải chủ sở hữu course.</exception>
    Task<QuizSummaryResponse> CreateQuizAsync(
        CreateQuizRequest request,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    /// <summary>
    /// Cập nhật metadata đề thi (PATCH semantics — chỉ update field không null).
    /// </summary>
    /// <exception cref="KeyNotFoundException">Quiz không tồn tại.</exception>
    /// <exception cref="UnauthorizedAccessException">Instructor không phải chủ sở hữu quiz.</exception>
    Task UpdateQuizAsync(
        Guid quizId,
        UpdateQuizRequest request,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    /// <summary>
    /// Xóa đề thi và toàn bộ câu hỏi/đáp án (cascade).
    /// </summary>
    /// <exception cref="KeyNotFoundException">Quiz không tồn tại.</exception>
    /// <exception cref="UnauthorizedAccessException">Instructor không phải chủ sở hữu quiz.</exception>
    Task DeleteQuizAsync(
        Guid quizId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    // ── Question CRUD ─────────────────────────────────────────────────────────

    /// <summary>
    /// Lấy danh sách câu hỏi của một đề thi (theo thứ tự Order).
    /// Đây là endpoint chính mà ExamBuilder Frontend gọi để hiển thị.
    /// </summary>
    /// <exception cref="KeyNotFoundException">Quiz không tồn tại.</exception>
    /// <exception cref="UnauthorizedAccessException">Instructor không phải chủ sở hữu quiz.</exception>
    Task<IReadOnlyList<QuestionDetailResponse>> GetQuestionsAsync(
        Guid quizId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    /// <summary>
    /// Thêm câu hỏi mới vào đề thi.
    /// Order được tự động gán = QuestionCount + 1 (append cuối).
    /// </summary>
    /// <exception cref="KeyNotFoundException">Quiz không tồn tại.</exception>
    /// <exception cref="UnauthorizedAccessException">Instructor không phải chủ sở hữu quiz.</exception>
    /// <exception cref="ArgumentException">Thiếu đáp án đúng hoặc số đáp án không hợp lệ.</exception>
    Task<QuestionCreatedResponse> AddQuestionAsync(
        Guid quizId,
        UpsertQuestionRequest request,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    /// <summary>
    /// Cập nhật nội dung câu hỏi và replace toàn bộ danh sách đáp án.
    /// </summary>
    /// <exception cref="KeyNotFoundException">Quiz hoặc Question không tồn tại.</exception>
    /// <exception cref="UnauthorizedAccessException">Instructor không phải chủ sở hữu quiz.</exception>
    Task UpdateQuestionAsync(
        Guid quizId,
        Guid questionId,
        UpsertQuestionRequest request,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    /// <summary>
    /// Xóa câu hỏi và toàn bộ đáp án. Sau khi xóa, tự động re-number Order của các câu còn lại.
    /// </summary>
    /// <exception cref="KeyNotFoundException">Quiz hoặc Question không tồn tại.</exception>
    /// <exception cref="UnauthorizedAccessException">Instructor không phải chủ sở hữu quiz.</exception>
    Task DeleteQuestionAsync(
        Guid quizId,
        Guid questionId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    /// <summary>
    /// Sắp xếp lại thứ tự câu hỏi theo danh sách QuestionId mới (dùng cho drag-drop).
    /// Danh sách phải chứa đúng tất cả QuestionId hiện có, không thừa không thiếu.
    /// </summary>
    /// <exception cref="KeyNotFoundException">Quiz không tồn tại.</exception>
    /// <exception cref="UnauthorizedAccessException">Instructor không phải chủ sở hữu quiz.</exception>
    /// <exception cref="ArgumentException">Danh sách QuestionId không khớp với câu hỏi thực tế trong quiz.</exception>
    Task ReorderQuestionsAsync(
        Guid quizId,
        ReorderQuestionsRequest request,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);
}
