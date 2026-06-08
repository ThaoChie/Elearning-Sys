using LMS.Application.Features.Auth.DTOs;
using MediatR;

namespace LMS.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: yêu cầu đăng nhập.
/// Email được normalize (lowercase) tại Validator.
/// </summary>
public sealed record LoginCommand(string Email, string Password)
    : IRequest<LoginResponse>;
