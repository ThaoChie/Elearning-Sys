using LMS.Application.Features.Exam.DTOs;
using MediatR;

namespace LMS.Application.Features.Exam.Commands;

/// <summary>
/// CQRS Command: client gửi heartbeat để đồng bộ trạng thái phiên thi.
///
/// RÀNG BUỘC BẢO MẬT:
/// - Command KHÔNG chứa bất kỳ thông tin thời gian nào từ client.
/// - Mọi tính toán thời gian được thực hiện server-side trong Handler.
/// - UserId được lấy từ JWT Claims tại Controller, KHÔNG từ request body.
/// </summary>
/// <param name="ExamId">ID bài thi (từ route parameter).</param>
/// <param name="UserId">ID thí sinh (từ JWT Claims, KHÔNG từ body/URL).</param>
public sealed record HeartbeatCommand(Guid ExamId, Guid UserId)
    : IRequest<HeartbeatResponse>;
