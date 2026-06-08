using LMS.Application.Features.Exam.DTOs;
using LMS.Domain.Exceptions;
using LMS.Domain.Interfaces;
using MediatR;

namespace LMS.Application.Features.Exam.Commands;

/// <summary>
/// Handler xử lý báo cáo vi phạm (tab-switch, fullscreen exit…).
///
/// Luồng bảo mật:
/// 1. UserId lấy từ Command (extract từ JWT Claims tại Controller).
/// 2. Ownership Check: GetActiveSessionAsync(ExamId, UserId).
/// 3. Kiểm tra hết giờ server-side trước khi ghi vi phạm (double-check).
/// 4. RecordViolation() tăng ViolationCount. Nếu đủ 3 → ForceSubmit.
/// 5. Persist và trả ViolationResponse.
/// 6. Server HOÀN TOÀN kiểm soát ViolationCount – không nhận số này từ client.
/// </summary>
public sealed class ReportViolationCommandHandler(IExamSessionRepository sessionRepository)
    : IRequestHandler<ReportViolationCommand, ViolationResponse>
{
    public async Task<ViolationResponse> Handle(ReportViolationCommand request, CancellationToken ct)
    {
        // ── Ownership Check ───────────────────────────────────────────────────
        var session = await sessionRepository.GetActiveSessionAsync(
            request.ExamId, request.UserId, ct);

        if (session is null)
            throw new ExamSessionNotFoundException(request.ExamId, request.UserId);

        // ── Double-check hết giờ server-side ─────────────────────────────────
        // Nếu client gửi violation sau khi đã hết giờ, xử lý hết giờ trước.
        if (session.IsExpired())
        {
            session.MarkViolated();
            await sessionRepository.SaveChangesAsync(ct);
            throw new ExamTimeExpiredException(session.SessionId);
        }

        // ── Ghi nhận vi phạm (server-managed counter) ────────────────────────
        // RecordViolation() tự tăng ViolationCount và kiểm tra ngưỡng 3.
        // TUYỆT ĐỐI KHÔNG dùng bất kỳ ViolationCount từ client.
        var isForceSubmitted = session.RecordViolation();
        await sessionRepository.SaveChangesAsync(ct);

        var message = isForceSubmitted
            ? $"Vi phạm lần {session.ViolationCount}: bài thi đã bị nộp tự động (Force Submit)."
            : $"Vi phạm lần {session.ViolationCount}/3: {request.ViolationType}. " +
              $"Còn {3 - session.ViolationCount} lần trước khi bị Force Submit.";

        if (isForceSubmitted)
            throw new ExamForceSubmittedException(session.SessionId, session.ViolationCount);

        return new ViolationResponse(
            ViolationCount: session.ViolationCount,
            IsForceSubmitted: false,
            Message: message
        );
    }
}
