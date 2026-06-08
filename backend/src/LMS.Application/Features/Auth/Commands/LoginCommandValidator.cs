using FluentValidation;

namespace LMS.Application.Features.Auth.Commands;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không đúng định dạng.")
            .MaximumLength(256);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự.")
            .MaximumLength(128);
    }
}
