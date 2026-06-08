using FluentValidation;

namespace LMS.Application.Features.Exam.Commands;

public sealed class ReportViolationCommandValidator : AbstractValidator<ReportViolationCommand>
{
    // Các loại vi phạm hợp lệ mà client được phép gửi
    private static readonly HashSet<string> AllowedViolationTypes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "TabSwitch",
            "FullscreenExit",
            "CopyAttempt",
            "RightClickAttempt"
        };

    public ReportViolationCommandValidator()
    {
        RuleFor(x => x.ExamId)
            .NotEmpty().WithMessage("ExamId không hợp lệ.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId không hợp lệ.");

        RuleFor(x => x.ViolationType)
            .NotEmpty().WithMessage("ViolationType không được để trống.")
            .MaximumLength(64).WithMessage("ViolationType quá dài.")
            .Must(v => AllowedViolationTypes.Contains(v))
            .WithMessage($"ViolationType không hợp lệ. Giá trị cho phép: {string.Join(", ", AllowedViolationTypes)}.");
    }
}
