using FluentValidation;
using Microsoft.AspNetCore.Http;

namespace LMS.Application.Features.Assignment.Commands;

/// <summary>
/// Validator cho <see cref="SubmitAssignmentCommand"/>.
///
/// BR-18: Dung lượng file không được vượt 50 MB.
/// BR-16: AssignmentId và File không được null/rỗng.
/// BR-17: Phần mở rộng file phải nằm trong danh sách cho phép.
/// </summary>
public sealed class SubmitAssignmentCommandValidator : AbstractValidator<SubmitAssignmentCommand>
{
    /// <summary>Giới hạn kích thước tối đa: 50 MB (BR-18).</summary>
    private const long MaxFileSizeBytes = 50L * 1024 * 1024; // 50 MB

    /// <summary>
    /// Các phần mở rộng file được phép (BR-17).
    /// Magic bytes sẽ được kiểm tra riêng tại Infrastructure layer.
    /// </summary>
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx",
        ".xls", ".xlsx",
        ".ppt", ".pptx",
        ".zip", ".rar",
        ".jpg", ".jpeg", ".png"
    };

    public SubmitAssignmentCommandValidator()
    {
        RuleFor(x => x.AssignmentId)
            .NotEmpty()
            .WithMessage("AssignmentId không được rỗng.");

        RuleFor(x => x.StudentId)
            .NotEmpty()
            .WithMessage("StudentId không được rỗng (phải lấy từ JWT Claims).");

        RuleFor(x => x.File)
            .NotNull()
            .WithMessage("File bài tập không được null.");

        When(x => x.File != null, () =>
        {
            // BR-18: Giới hạn 50 MB
            RuleFor(x => x.File.Length)
                .LessThanOrEqualTo(MaxFileSizeBytes)
                .WithMessage($"File không được vượt quá {MaxFileSizeBytes / 1_048_576} MB.");

            RuleFor(x => x.File.Length)
                .GreaterThan(0)
                .WithMessage("File không được rỗng.");

            // BR-17: Kiểm tra phần mở rộng (defence-in-depth – magic bytes là lớp chính)
            RuleFor(x => x.File.FileName)
                .NotEmpty()
                .WithMessage("Tên file không được rỗng.")
                .Must(name => AllowedExtensions.Contains(Path.GetExtension(name)))
                .WithMessage(x =>
                    $"Phần mở rộng '{Path.GetExtension(x.File.FileName)}' không được phép. " +
                    $"Chấp nhận: {string.Join(", ", AllowedExtensions)}");
        });
    }
}
