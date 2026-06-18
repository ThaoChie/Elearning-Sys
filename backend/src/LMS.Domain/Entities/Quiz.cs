namespace LMS.Domain.Entities;

/// <summary>
/// Bài kiểm tra trắc nghiệm gắn với một khoá học.
/// Đề thi được xáo trộn server-side – đáp án KHÔNG bao giờ xuất hiện trong response.
/// </summary>
public class Quiz
{
    public Guid      QuizId           { get; private set; }
    public Guid      CourseId         { get; private set; }
    public string    Title            { get; private set; } = string.Empty;

    /// <summary>Thời gian làm bài (phút). Phải > 0.</summary>
    public int       TimeLimitMin     { get; private set; }
    public DateTime? StartAt          { get; private set; }
    public DateTime? EndAt            { get; private set; }
    public bool      AntiCheatEnabled { get; private set; }
    public DateTime  CreatedAt        { get; private set; }

    // EF Core navigation
    public Course Course { get; private set; } = null!;

    private readonly List<Question> _questions = [];
    public IReadOnlyCollection<Question> Questions => _questions.AsReadOnly();

    private Quiz() { }

    public static Quiz Create(Guid courseId, string title, int timeLimitMin, bool antiCheatEnabled = true)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        if (timeLimitMin <= 0)
            throw new ArgumentOutOfRangeException(nameof(timeLimitMin), "Thời gian làm bài phải lớn hơn 0.");

        return new Quiz
        {
            QuizId           = Guid.NewGuid(),
            CourseId         = courseId,
            Title            = title.Trim(),
            TimeLimitMin     = timeLimitMin,
            AntiCheatEnabled = antiCheatEnabled,
            CreatedAt        = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Cập nhật metadata đề thi. Gọi từ Service layer sau khi đã xác thực quyền.
    /// </summary>
    public void UpdateMetadata(string? newTitle, int? newTimeLimitMin, bool? newAntiCheatEnabled)
    {
        if (!string.IsNullOrWhiteSpace(newTitle))
            Title = newTitle.Trim();

        if (newTimeLimitMin.HasValue)
        {
            if (newTimeLimitMin.Value <= 0)
                throw new ArgumentOutOfRangeException(nameof(newTimeLimitMin), "Thời gian làm bài phải lớn hơn 0.");
            TimeLimitMin = newTimeLimitMin.Value;
        }

        if (newAntiCheatEnabled.HasValue)
            AntiCheatEnabled = newAntiCheatEnabled.Value;
    }

    /// <summary>
    /// Đặt lịch thi (Window). StartAt và EndAt phải đồng thời được set.
    /// </summary>
    public void SetSchedule(DateTime? startAt, DateTime? endAt)
    {
        if (startAt.HasValue && endAt.HasValue && endAt <= startAt)
            throw new ArgumentException("EndAt phải sau StartAt.");
        StartAt = startAt;
        EndAt   = endAt;
    }
}

/// <summary>
/// Câu hỏi trong Quiz.
/// </summary>
public class Question
{
    public Guid     QuestionId { get; private set; }
    public Guid     QuizId     { get; private set; }
    public string   Content    { get; private set; } = string.Empty;
    public int      Order      { get; private set; }
    public DateTime CreatedAt  { get; private set; }

    // EF Core navigation
    public Quiz Quiz { get; private set; } = null!;

    private readonly List<Answer> _answers = [];
    public IReadOnlyCollection<Answer> Answers => _answers.AsReadOnly();

    private Question() { }

    public static Question Create(Guid quizId, string content, int order)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content);

        return new Question
        {
            QuestionId = Guid.NewGuid(),
            QuizId     = quizId,
            Content    = content.Trim(),
            Order      = order,
            CreatedAt  = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Cập nhật nội dung câu hỏi. Chỉ gọi từ Service sau khi đã xác thực ownership.
    /// </summary>
    public void UpdateContent(string newContent)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(newContent);
        Content = newContent.Trim();
    }

    /// <summary>
    /// Cập nhật thứ tự câu hỏi (dùng khi reorder).
    /// </summary>
    public void SetOrder(int order)
    {
        if (order <= 0)
            throw new ArgumentOutOfRangeException(nameof(order), "Order phải lớn hơn 0.");
        Order = order;
    }
}

/// <summary>
/// Lựa chọn trả lời cho một câu hỏi.
/// IsCorrect TUYỆT ĐỐI KHÔNG được serialize ra JSON response gửi cho client.
/// </summary>
public class Answer
{
    public Guid     AnswerId   { get; private set; }
    public Guid     QuestionId { get; private set; }
    public string   Content    { get; private set; } = string.Empty;

    /// <summary>
    /// Đánh dấu đáp án đúng – chỉ được dùng server-side khi chấm điểm.
    /// TUYỆT ĐỐI không serialize field này ra client response.
    /// </summary>
    public bool     IsCorrect  { get; private set; }
    public int      Order      { get; private set; }

    // EF Core navigation
    public Question Question { get; private set; } = null!;

    private Answer() { }

    public static Answer Create(Guid questionId, string content, bool isCorrect, int order)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content);

        return new Answer
        {
            AnswerId   = Guid.NewGuid(),
            QuestionId = questionId,
            Content    = content.Trim(),
            IsCorrect  = isCorrect,
            Order      = order
        };
    }

    /// <summary>
    /// Cập nhật nội dung và trạng thái đáp án.
    /// </summary>
    public void Update(string content, bool isCorrect)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content);
        Content   = content.Trim();
        IsCorrect = isCorrect;
    }
}
