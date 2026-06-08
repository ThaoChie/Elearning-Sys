namespace LMS.Domain.Entities;

/// <summary>
/// Trạng thái phiên thi.
/// </summary>
public enum ExamSessionStatus
{
    /// <summary>Đang diễn ra bình thường.</summary>
    Active,

    /// <summary>Thí sinh nộp bài hợp lệ (hết giờ tự nhiên hoặc chủ động nộp).</summary>
    Submitted,

    /// <summary>Hệ thống Force Submit do vi phạm >= 3 lần tab-switch / fullscreen.</summary>
    ForceSubmitted,

    /// <summary>Session bị đánh dấu Violated (hết giờ phát hiện qua heartbeat).</summary>
    Violated
}

/// <summary>
/// Phiên làm bài thi – đây là trung tâm kiểm soát chống gian lận thời gian và tab-switch.
///
/// Nguyên tắc bảo mật:
/// - <see cref="StartAt"/> được set bởi server, không bao giờ tin vào thời gian client.
/// - <see cref="DurationSeconds"/> được lấy từ config bài thi, không từ client.
/// - Tất cả tính toán thời gian còn lại được thực hiện server-side.
/// - <see cref="ViolationCount"/> >= 3 → Force Submit.
/// </summary>
public class ExamSession
{
    public Guid SessionId { get; private set; }

    /// <summary>ID của bài thi (đề thi).</summary>
    public Guid ExamId { get; private set; }

    /// <summary>
    /// ID của thí sinh – lấy từ JWT Claims, KHÔNG từ URL/Body.
    /// </summary>
    public Guid UserId { get; private set; }

    /// <summary>
    /// Thời điểm thí sinh bắt đầu làm bài – do server gán, không phụ thuộc client.
    /// Lưu UTC để tránh lỗi timezone.
    /// </summary>
    public DateTime StartAt { get; private set; }

    /// <summary>
    /// Thời lượng thi (giây) – lấy từ config bài thi, không từ client.
    /// Ví dụ: 90 phút = 5400 giây.
    /// </summary>
    public int DurationSeconds { get; private set; }

    /// <summary>
    /// Số lần vi phạm (tab-switch, thoát fullscreen…).
    /// Đạt 3 → ForceSubmit tự động.
    /// </summary>
    public int ViolationCount { get; private set; }

    /// <summary>Trạng thái hiện tại của phiên thi.</summary>
    public ExamSessionStatus Status { get; private set; }

    public DateTime CreatedAt { get; private set; }

    // EF Core cần constructor không tham số (private để tránh dùng ngoài)
    private ExamSession() { }

    /// <summary>
    /// Khởi tạo phiên thi mới – thời gian bắt đầu do server tạo (DateTime.UtcNow).
    /// </summary>
    /// <param name="examId">ID bài thi.</param>
    /// <param name="userId">ID thí sinh (từ JWT Claims).</param>
    /// <param name="durationSeconds">Thời lượng cho phép (giây) – từ config bài thi.</param>
    public static ExamSession Create(Guid examId, Guid userId, int durationSeconds)
    {
        if (durationSeconds <= 0)
            throw new ArgumentOutOfRangeException(nameof(durationSeconds),
                "Thời lượng thi phải lớn hơn 0 giây.");

        var now = DateTime.UtcNow;
        return new ExamSession
        {
            SessionId       = Guid.NewGuid(),
            ExamId          = examId,
            UserId          = userId,
            StartAt         = now,
            DurationSeconds = durationSeconds,
            ViolationCount  = 0,
            Status          = ExamSessionStatus.Active,
            CreatedAt       = now
        };
    }

    // ── Domain behaviours ────────────────────────────────────────────────────

    /// <summary>
    /// Kiểm tra phiên thi đã hết giờ chưa dựa hoàn toàn trên server-side clock.
    /// KHÔNG nhận tham số thời gian từ client.
    /// </summary>
    public bool IsExpired() =>
        DateTime.UtcNow >= StartAt.AddSeconds(DurationSeconds);

    /// <summary>
    /// Trả về số giây còn lại (server-side). Không bao giờ âm.
    /// KHÔNG tin vào bất kỳ thông tin thời gian nào từ client.
    /// </summary>
    public int GetRemainingSeconds()
    {
        var deadline = StartAt.AddSeconds(DurationSeconds);
        var remaining = (deadline - DateTime.UtcNow).TotalSeconds;
        return remaining <= 0 ? 0 : (int)Math.Ceiling(remaining);
    }

    /// <summary>
    /// Kiểm tra phiên thi có đang hoạt động không (Active + chưa hết giờ).
    /// </summary>
    public bool IsActive() => Status == ExamSessionStatus.Active && !IsExpired();

    /// <summary>
    /// Ghi nhận một lần vi phạm (tab-switch, thoát fullscreen…).
    /// Nếu đạt ngưỡng 3 → tự động ForceSubmit.
    /// </summary>
    /// <returns>
    /// <c>true</c> nếu vi phạm này kích hoạt Force Submit.
    /// </returns>
    /// <exception cref="InvalidOperationException">Phiên không còn Active.</exception>
    public bool RecordViolation()
    {
        if (Status != ExamSessionStatus.Active)
            throw new InvalidOperationException(
                $"Không thể ghi nhận vi phạm: phiên thi đang ở trạng thái '{Status}'.");

        ViolationCount++;

        if (ViolationCount >= 3)
        {
            Status = ExamSessionStatus.ForceSubmitted;
            return true; // báo hiệu Force Submit
        }

        return false;
    }

    /// <summary>
    /// Đánh dấu phiên thi là Violated khi heartbeat phát hiện hết giờ.
    /// </summary>
    /// <exception cref="InvalidOperationException">Phiên không còn Active.</exception>
    public void MarkViolated()
    {
        if (Status != ExamSessionStatus.Active)
            throw new InvalidOperationException(
                $"Không thể chuyển sang Violated: phiên thi đang ở trạng thái '{Status}'.");

        Status = ExamSessionStatus.Violated;
    }

    /// <summary>
    /// Thí sinh nộp bài thủ công (hoặc hết giờ hợp lệ).
    /// </summary>
    /// <exception cref="InvalidOperationException">Phiên không còn Active.</exception>
    public void Submit()
    {
        if (Status != ExamSessionStatus.Active)
            throw new InvalidOperationException(
                $"Không thể nộp bài: phiên thi đang ở trạng thái '{Status}'.");

        Status = ExamSessionStatus.Submitted;
    }
}
