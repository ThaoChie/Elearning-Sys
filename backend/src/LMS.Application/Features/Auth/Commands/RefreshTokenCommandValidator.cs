using FluentValidation;

namespace LMS.Application.Features.Auth.Commands;

public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh Token không được rỗng.")
            .MaximumLength(64).WithMessage("Refresh Token không hợp lệ.");
    }
}
