namespace LMS.Application.Features.Exam.DTOs;

/// <summary>
/// Kết quả heartbeat: server trả về thời gian còn lại (tính server-side).
/// Client KHÔNG được tin vào giá trị thời gian của chính nó.
/// </summary>
/// <param name="RemainingSeconds">Số giây còn lại (server-side), luôn >= 0.</param>
/// <param name="Status">Trạng thái phiên thi hiện tại.</param>
public sealed record HeartbeatResponse(
    int RemainingSeconds,
    string Status
);

/// <summary>
/// Kết quả ghi nhận vi phạm.
/// </summary>
/// <param name="ViolationCount">Tổng số vi phạm đã tích lũy.</param>
/// <param name="IsForceSubmitted">true nếu lần vi phạm này kích hoạt Force Submit.</param>
/// <param name="Message">Thông báo tường minh cho client.</param>
public sealed record ViolationResponse(
    int ViolationCount,
    bool IsForceSubmitted,
    string Message
);
