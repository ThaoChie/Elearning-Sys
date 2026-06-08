using MediatR;

namespace LMS.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: Đăng xuất.
/// Nhận JTI và thời điểm hết hạn của Access Token để đưa vào Redis Blacklist.
/// Đồng thời revoke Refresh Token trong DB.
/// </summary>
public sealed record LogoutCommand(
    Guid UserId,
    string Jti,
    DateTime AccessTokenExpiry
) : IRequest;
