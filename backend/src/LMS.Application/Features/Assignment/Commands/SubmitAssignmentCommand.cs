using MediatR;
using Microsoft.AspNetCore.Http;

namespace LMS.Application.Features.Assignment.Commands;

/// <summary>
/// Command nộp bài tập.
///
/// Bảo mật:
/// - <see cref="StudentId"/> được set bởi Handler từ JWT Claims,
///   KHÔNG được phép truyền vào từ client.
/// - <see cref="File"/> là IFormFile – dữ liệu thô chưa xử lý,
///   sẽ được xác thực bảo mật trong Handler.
/// </summary>
public sealed class SubmitAssignmentCommand : IRequest<SubmitAssignmentResponse>
{
    /// <summary>ID bài tập (từ route parameter).</summary>
    public Guid AssignmentId { get; init; }

    /// <summary>
    /// ID sinh viên – PHẢI được set từ JWT Claims trong Handler,
    /// KHÔNG lấy từ request body hay query string.
    /// </summary>
    public Guid StudentId { get; init; }

    /// <summary>File bài tập do sinh viên upload.</summary>
    public IFormFile File { get; init; } = null!;
}
