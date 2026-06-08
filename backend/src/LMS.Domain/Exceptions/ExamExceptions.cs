namespace LMS.Domain.Exceptions;

/// <summary>
/// Ném khi heartbeat phát hiện phiên thi đã hết giờ (server-side timer).
/// </summary>
public sealed class ExamTimeExpiredException(Guid sessionId)
    : Exception($"Phiên thi {sessionId} đã hết giờ.")
{
    public Guid SessionId { get; } = sessionId;
}

/// <summary>
/// Ném khi phiên thi bị Force Submit do vi phạm đủ 3 lần.
/// </summary>
public sealed class ExamForceSubmittedException(Guid sessionId, int violationCount)
    : Exception($"Phiên thi {sessionId} bị Force Submit sau {violationCount} lần vi phạm.")
{
    public Guid SessionId { get; } = sessionId;
    public int ViolationCount { get; } = violationCount;
}

/// <summary>
/// Ném khi không tìm thấy phiên thi hoặc phiên không thuộc về user đang yêu cầu.
/// Dùng message chung chung để tránh tiết lộ thông tin.
/// </summary>
public sealed class ExamSessionNotFoundException(Guid examId, Guid userId)
    : Exception($"Không tìm thấy phiên thi đang hoạt động cho exam {examId}.")
{
    public Guid ExamId { get; } = examId;
    public Guid UserId { get; } = userId;
}
