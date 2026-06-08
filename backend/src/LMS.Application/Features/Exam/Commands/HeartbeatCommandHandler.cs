using LMS.Application.Features.Exam.DTOs;
using LMS.Domain.Exceptions;
using LMS.Domain.Interfaces;
using MediatR;

namespace LMS.Application.Features.Exam.Commands;

/// <summary>
/// Handler xử lý Heartbeat – đây là lõi của server-side timer.
///
/// Luồng bảo mật:
/// 1. Lấy UserId từ Command (đã được Controller extract từ JWT Claims).
/// 2. GetActiveSessionAsync với cả ExamId + UserId (Ownership Check).
/// 3. KHÔNG đọc bất kỳ thông tin thời gian từ request client.
/// 4. Tính toán thời gian còn lại hoàn toàn từ ExamSession.StartAt (server) + DurationSeconds.
/// 5. Nếu hết giờ → MarkViolated() + SaveChanges() → ném ExamTimeExpiredException → HTTP 400.
/// 6. Nếu chưa hết → trả HeartbeatResponse với RemainingSeconds tính server-side.
/// </summary>
public sealed class HeartbeatCommandHandler(IExamSessionRepository sessionRepository)
    : IRequestHandler<HeartbeatCommand, HeartbeatResponse>
{
    public async Task<HeartbeatResponse> Handle(HeartbeatCommand request, CancellationToken ct)
    {
        // ── Ownership Check ───────────────────────────────────────────────────
        // Lọc theo CÙNG LÚC ExamId + UserId để đảm bảo user chỉ xem phiên của mình.
        var session = await sessionRepository.GetActiveSessionAsync(
            request.ExamId, request.UserId, ct);

        if (session is null)
            throw new ExamSessionNotFoundException(request.ExamId, request.UserId);

        // ── Server-side Timer Check ───────────────────────────────────────────
        // IsExpired() tính toán hoàn toàn từ session.StartAt (server clock).
        // TUYỆT ĐỐI KHÔNG dùng bất kỳ giá trị thời gian từ client.
        if (session.IsExpired())
        {
            session.MarkViolated();
            await sessionRepository.SaveChangesAsync(ct);

            // HTTP 400 được map từ exception này tại Controller
            throw new ExamTimeExpiredException(session.SessionId);
        }

        // ── Trả về thời gian còn lại (server-side) ───────────────────────────
        var remaining = session.GetRemainingSeconds();

        return new HeartbeatResponse(
            RemainingSeconds: remaining,
            Status: session.Status.ToString()
        );
    }
}
