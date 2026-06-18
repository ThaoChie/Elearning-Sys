using LMS.Application.Features.Quiz.DTOs;
using LMS.Application.Features.Quiz.Services;
using LMS.Domain.Entities;
using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LMS.Infrastructure.Persistence.Services;

/// <summary>
/// Triển khai IQuizService — Business logic cho quản lý Đề thi và Câu hỏi.
/// Đặt trong Infrastructure vì inject AppDbContext trực tiếp.
/// </summary>
public sealed class QuizService(
    AppDbContext db,
    ILogger<QuizService> logger) : IQuizService
{
    // ════════════════════════════════════════════════════════════════════════
    //  QUIZ CRUD
    // ════════════════════════════════════════════════════════════════════════

    public async Task<IReadOnlyList<QuizSummaryResponse>> GetQuizzesAsync(
        Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        var query = db.Quizzes
            .Include(q => q.Course)
            .Include(q => q.Questions)
            .AsNoTracking()
            .AsQueryable();

        if (!isAdmin)
            query = query.Where(q => q.Course.InstructorId == actorId);

        var quizzes = await query
            .OrderByDescending(q => q.CreatedAt)
            .Select(q => new QuizSummaryResponse
            {
                Id               = q.QuizId,
                Title            = q.Title,
                CourseId         = q.CourseId,
                CourseName       = q.Course.Title,
                DurationMinutes  = q.TimeLimitMin,
                AntiCheatEnabled = q.AntiCheatEnabled,
                QuestionCount    = q.Questions.Count,
                Status           = q.EndAt.HasValue && q.EndAt < DateTime.UtcNow
                                   ? "Ended"
                                   : q.StartAt.HasValue && q.StartAt > DateTime.UtcNow
                                     ? "Scheduled"
                                     : "Active",
                StartAt          = q.StartAt,
                EndAt            = q.EndAt,
                CreatedAt        = q.CreatedAt
            })
            .ToListAsync(ct);

        return quizzes.AsReadOnly();
    }

    public async Task<QuizDetailResponse> GetQuizDetailAsync(
        Guid quizId, Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        var quiz = await db.Quizzes
            .Include(q => q.Course)
            .Include(q => q.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.Answers.OrderBy(a => a.Order))
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.QuizId == quizId, ct)
            ?? throw new KeyNotFoundException($"Không tìm thấy đề thi với Id = {quizId}.");

        EnsureOwnership(quiz, actorId, isAdmin);
        return MapToDetail(quiz);
    }

    public async Task<QuizSummaryResponse> CreateQuizAsync(
        CreateQuizRequest request, Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        var course = await db.Courses
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CourseId == request.CourseId, ct)
            ?? throw new KeyNotFoundException($"Không tìm thấy khoá học với Id = {request.CourseId}.");

        if (!isAdmin && course.InstructorId != actorId)
            throw new UnauthorizedAccessException("Bạn không có quyền tạo đề thi cho khoá học này.");

        var quiz = Quiz.Create(
            request.CourseId,
            request.Title,
            request.DurationMinutes,
            request.AntiCheatEnabled);

        db.Quizzes.Add(quiz);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Quiz created: {QuizId} by {ActorId}", quiz.QuizId, actorId);

        return new QuizSummaryResponse
        {
            Id               = quiz.QuizId,
            Title            = quiz.Title,
            CourseId         = quiz.CourseId,
            CourseName       = course.Title,
            DurationMinutes  = quiz.TimeLimitMin,
            AntiCheatEnabled = quiz.AntiCheatEnabled,
            QuestionCount    = 0,
            Status           = "Active",
            CreatedAt        = quiz.CreatedAt
        };
    }

    public async Task UpdateQuizAsync(
        Guid quizId, UpdateQuizRequest request, Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        var quiz = await db.Quizzes
            .Include(q => q.Course)
            .FirstOrDefaultAsync(q => q.QuizId == quizId, ct)
            ?? throw new KeyNotFoundException($"Không tìm thấy đề thi với Id = {quizId}.");

        EnsureOwnership(quiz, actorId, isAdmin);

        quiz.UpdateMetadata(request.Title, request.DurationMinutes, request.AntiCheatEnabled);

        if (request.StartAt.HasValue || request.EndAt.HasValue)
            quiz.SetSchedule(request.StartAt, request.EndAt);

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Quiz updated: {QuizId} by {ActorId}", quizId, actorId);
    }

    public async Task DeleteQuizAsync(
        Guid quizId, Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        var quiz = await db.Quizzes
            .Include(q => q.Course)
            .FirstOrDefaultAsync(q => q.QuizId == quizId, ct)
            ?? throw new KeyNotFoundException($"Không tìm thấy đề thi với Id = {quizId}.");

        EnsureOwnership(quiz, actorId, isAdmin);
        db.Quizzes.Remove(quiz);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Quiz deleted: {QuizId} by {ActorId}", quizId, actorId);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  QUESTION CRUD
    // ════════════════════════════════════════════════════════════════════════

    public async Task<IReadOnlyList<QuestionDetailResponse>> GetQuestionsAsync(
        Guid quizId, Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        var quiz = await db.Quizzes
            .Include(q => q.Course)
            .Include(q => q.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.Answers.OrderBy(a => a.Order))
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.QuizId == quizId, ct)
            ?? throw new KeyNotFoundException($"Không tìm thấy đề thi với Id = {quizId}.");

        EnsureOwnership(quiz, actorId, isAdmin);

        return quiz.Questions
            .Select(MapToQuestionDetail)
            .ToList()
            .AsReadOnly();
    }

    public async Task<QuestionCreatedResponse> AddQuestionAsync(
        Guid quizId, UpsertQuestionRequest request, Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        ValidateAnswers(request.Answers);

        var quiz = await db.Quizzes
            .Include(q => q.Course)
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.QuizId == quizId, ct)
            ?? throw new KeyNotFoundException($"Không tìm thấy đề thi với Id = {quizId}.");

        EnsureOwnership(quiz, actorId, isAdmin);

        var order    = quiz.Questions.Count + 1;
        var question = Question.Create(quizId, request.Content, order);
        db.Questions.Add(question);
        await db.SaveChangesAsync(ct);

        for (int i = 0; i < request.Answers.Count; i++)
        {
            var ans = request.Answers[i];
            db.Answers.Add(Answer.Create(question.QuestionId, ans.Content, ans.IsCorrect, i + 1));
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Question added: {QuestionId} to Quiz {QuizId} by {ActorId}",
            question.QuestionId, quizId, actorId);

        return new QuestionCreatedResponse
        {
            Id           = question.QuestionId,
            Content      = question.Content,
            Order        = question.Order,
            TotalAnswers = request.Answers.Count
        };
    }

    public async Task UpdateQuestionAsync(
        Guid quizId, Guid questionId, UpsertQuestionRequest request,
        Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        ValidateAnswers(request.Answers);

        var quiz = await db.Quizzes
            .Include(q => q.Course)
            .FirstOrDefaultAsync(q => q.QuizId == quizId, ct)
            ?? throw new KeyNotFoundException($"Không tìm thấy đề thi với Id = {quizId}.");

        EnsureOwnership(quiz, actorId, isAdmin);

        var question = await db.Questions
            .Include(q => q.Answers)
            .FirstOrDefaultAsync(q => q.QuestionId == questionId && q.QuizId == quizId, ct)
            ?? throw new KeyNotFoundException($"Không tìm thấy câu hỏi với Id = {questionId}.");

        question.UpdateContent(request.Content);
        db.Answers.RemoveRange(question.Answers);

        for (int i = 0; i < request.Answers.Count; i++)
        {
            var ans = request.Answers[i];
            db.Answers.Add(Answer.Create(questionId, ans.Content, ans.IsCorrect, i + 1));
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Question updated: {QuestionId} in Quiz {QuizId} by {ActorId}",
            questionId, quizId, actorId);
    }

    public async Task DeleteQuestionAsync(
        Guid quizId, Guid questionId, Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        var quiz = await db.Quizzes
            .Include(q => q.Course)
            .FirstOrDefaultAsync(q => q.QuizId == quizId, ct)
            ?? throw new KeyNotFoundException($"Không tìm thấy đề thi với Id = {quizId}.");

        EnsureOwnership(quiz, actorId, isAdmin);

        var question = await db.Questions
            .Include(q => q.Answers)
            .FirstOrDefaultAsync(q => q.QuestionId == questionId && q.QuizId == quizId, ct)
            ?? throw new KeyNotFoundException($"Không tìm thấy câu hỏi với Id = {questionId}.");

        var deletedOrder = question.Order;
        db.Questions.Remove(question);
        await db.SaveChangesAsync(ct);

        // Re-number các câu hỏi phía sau
        var questionsToRenumber = await db.Questions
            .Where(q => q.QuizId == quizId && q.Order > deletedOrder)
            .ToListAsync(ct);

        foreach (var q in questionsToRenumber)
            q.SetOrder(q.Order - 1);

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Question deleted: {QuestionId} from Quiz {QuizId} by {ActorId}",
            questionId, quizId, actorId);
    }

    public async Task ReorderQuestionsAsync(
        Guid quizId, ReorderQuestionsRequest request, Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        var quiz = await db.Quizzes
            .Include(q => q.Course)
            .FirstOrDefaultAsync(q => q.QuizId == quizId, ct)
            ?? throw new KeyNotFoundException($"Không tìm thấy đề thi với Id = {quizId}.");

        EnsureOwnership(quiz, actorId, isAdmin);

        var questions = await db.Questions
            .Where(q => q.QuizId == quizId)
            .ToListAsync(ct);

        var existingIds  = questions.Select(q => q.QuestionId).ToHashSet();
        var requestedIds = request.OrderedQuestionIds.ToHashSet();

        if (!existingIds.SetEquals(requestedIds))
            throw new ArgumentException(
                "Danh sách QuestionId không khớp với câu hỏi thực tế trong đề thi.");

        if (request.OrderedQuestionIds.Count != requestedIds.Count)
            throw new ArgumentException("Danh sách QuestionId có giá trị trùng lặp.");

        var questionMap = questions.ToDictionary(q => q.QuestionId);
        for (int i = 0; i < request.OrderedQuestionIds.Count; i++)
            questionMap[request.OrderedQuestionIds[i]].SetOrder(i + 1);

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Questions reordered in Quiz {QuizId} by {ActorId}", quizId, actorId);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private static void EnsureOwnership(Quiz quiz, Guid actorId, bool isAdmin)
    {
        if (!isAdmin && quiz.Course.InstructorId != actorId)
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập đề thi này.");
    }

    private static void ValidateAnswers(List<AnswerRequest> answers)
    {
        if (answers.Count < 2)
            throw new ArgumentException("Câu hỏi phải có ít nhất 2 đáp án.");
        if (!answers.Any(a => a.IsCorrect))
            throw new ArgumentException("Phải có ít nhất 1 đáp án đúng (IsCorrect = true).");
    }

    private static QuizDetailResponse MapToDetail(Quiz quiz)
        => new()
        {
            Id               = quiz.QuizId,
            Title            = quiz.Title,
            CourseId         = quiz.CourseId,
            CourseName       = quiz.Course.Title,
            DurationMinutes  = quiz.TimeLimitMin,
            AntiCheatEnabled = quiz.AntiCheatEnabled,
            StartAt          = quiz.StartAt,
            EndAt            = quiz.EndAt,
            CreatedAt        = quiz.CreatedAt,
            Questions        = quiz.Questions.Select(MapToQuestionDetail).ToList()
        };

    private static QuestionDetailResponse MapToQuestionDetail(Question question)
        => new()
        {
            Id        = question.QuestionId,
            Content   = question.Content,
            Order     = question.Order,
            CreatedAt = question.CreatedAt,
            Answers   = question.Answers.Select(a => new AnswerDetailResponse
            {
                Id        = a.AnswerId,
                Content   = a.Content,
                Key       = ((char)('A' + a.Order - 1)).ToString(),
                IsCorrect = a.IsCorrect,
                Order     = a.Order
            }).ToList()
        };
}
