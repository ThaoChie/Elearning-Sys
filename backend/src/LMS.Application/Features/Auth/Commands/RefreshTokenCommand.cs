using LMS.Application.Features.Auth.DTOs;
using MediatR;

namespace LMS.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: Refresh Token Rotation.
/// Client gửi Refresh Token cũ → nhận Access Token MỚI + Refresh Token MỚI.
/// Token cũ bị revoke ngay lập tức.
/// Reuse Detection: nếu token cũ đã bị revoke → revoke toàn bộ session của user.
/// </summary>
public sealed record RefreshTokenCommand(string RefreshToken) : IRequest<LoginResponse>;
