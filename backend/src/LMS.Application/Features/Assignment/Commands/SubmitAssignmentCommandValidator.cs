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

    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip",
        "application/x-rar-compressed",
        "application/vnd.rar",
        "image/jpeg",
        "image/png"
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
            RuleFor(x => x.File.Length)
                .GreaterThan(0)
                .WithMessage("File không được rỗng.");

            // BR-17: Kiểm tra phần mở rộng (defence-in-depth – magic bytes là lớp chính)
            RuleFor(x => x.File)
                .Must(file =>
                {
                    var ext = Path.GetExtension(file.FileName);
                    if (AllowedExtensions.Contains(ext))
                        return true;

                    // Nếu Content-Type giả mạo là hợp lệ (ví dụ: application/pdf),
                    // để nó đi tiếp vào handler để magic bytes check trả về 422.
                    if (AllowedMimeTypes.Contains(file.ContentType))
                        return true;

                    return false;
                })
                .WithMessage(x =>
                    $"Phần mở rộng '{Path.GetExtension(x.File.FileName)}' không được phép. " +
                    $"Chấp nhận: {string.Join(", ", AllowedExtensions)}");
        });
    }
}
