using LMS.Application.Features.Exam.DTOs;
using MediatR;

namespace LMS.Application.Features.Exam.Commands;

/// <summary>
/// CQRS Command: client báo cáo vi phạm (tab-switch, thoát fullscreen…).
///
/// RÀNG BUỘC BẢO MẬT:
/// - Command KHÔNG chứa ViolationCount từ client. Server tự quản lý bộ đếm.
/// - UserId lấy từ JWT Claims, KHÔNG từ body/URL.
/// - ViolationType chỉ là label mô tả (audit log), không ảnh hưởng logic đếm.
/// </summary>
/// <param name="ExamId">ID bài thi (từ route parameter).</param>
/// <param name="UserId">ID thí sinh (từ JWT Claims).</param>
/// <param name="ViolationType">Loại vi phạm để ghi audit log (e.g. "TabSwitch", "FullscreenExit").</param>
public sealed record ReportViolationCommand(Guid ExamId, Guid UserId, string ViolationType)
    : IRequest<ViolationResponse>;
