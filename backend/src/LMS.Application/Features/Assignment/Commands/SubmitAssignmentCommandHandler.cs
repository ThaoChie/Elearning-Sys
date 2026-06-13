using LMS.Domain.Entities;
using LMS.Domain.Exceptions;
using LMS.Domain.Interfaces;
using MediatR;

namespace LMS.Application.Features.Assignment.Commands;

/// <summary>
/// Xử lý nộp bài tập với đầy đủ kiểm tra bảo mật:
///
/// Luồng xử lý (theo thứ tự):
///   1. Lấy StudentId từ JWT Claims (đã được set trước khi dispatch command).
///   2. Kiểm tra Assignment tồn tại.
///   3. Kiểm tra chưa nộp trùng (BR-16).
///   4. Kiểm tra kích thước file (BR-18: <= 50 MB).
///   5. Xác thực MIME type thực tế bằng magic bytes (BR-17).
///   6. Quét virus ClamAV – nếu phát hiện → ném <see cref="VirusDetectedException"/>.
///   7. Mã hoá AES-256-CBC.
///   8. Upload lên Object Storage với UUID key ngẫu nhiên.
///   9. Lưu metadata vào database.
/// </summary>
public sealed class SubmitAssignmentCommandHandler
    : IRequestHandler<SubmitAssignmentCommand, SubmitAssignmentResponse>
{
    // BR-18: 50 MB
    private const long MaxFileSizeBytes = 50L * 1024 * 1024;

    /// <summary>
    /// MIME type được phép upload (BR-17).
    /// Đây là "allow-list" phía Application – Infrastructure kiểm tra magic bytes thực tế.
    /// </summary>
    private static readonly IReadOnlyCollection<string> AllowedMimeTypes = new[]
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

    private readonly IAssignmentRepository            _assignmentRepo;
    private readonly IAssignmentSubmissionRepository  _submissionRepo;
    private readonly IFileSecurityService             _fileSecurity;
    private readonly IStorageService                  _storage;

    public SubmitAssignmentCommandHandler(
        IAssignmentRepository           assignmentRepo,
        IAssignmentSubmissionRepository submissionRepo,
        IFileSecurityService            fileSecurity,
        IStorageService                 storage)
    {
        _assignmentRepo = assignmentRepo;
        _submissionRepo = submissionRepo;
        _fileSecurity   = fileSecurity;
        _storage        = storage;
    }

    public async Task<SubmitAssignmentResponse> Handle(
        SubmitAssignmentCommand command,
        CancellationToken       cancellationToken)
    {
        // ── 1. Kiểm tra Assignment tồn tại ────────────────────────────────────
        var assignment = await _assignmentRepo.GetByIdAsync(command.AssignmentId, cancellationToken)
            ?? throw new KeyNotFoundException(
                $"Bài tập '{command.AssignmentId}' không tồn tại.");

        // ── 2. Ngăn nộp trùng (BR-16) ─────────────────────────────────────────
        var alreadySubmitted = await _submissionRepo.ExistsAsync(
            command.AssignmentId, command.StudentId, cancellationToken);
        if (alreadySubmitted)
            throw new InvalidOperationException(
                "Bạn đã nộp bài tập này. Liên hệ giảng viên nếu muốn nộp lại.");

        // ── 3. Kiểm tra kích thước (BR-18: <= 50 MB) ──────────────────────────
        if (command.File.Length > MaxFileSizeBytes)
            throw new FileSizeExceededException(
                command.File.FileName,
                command.File.Length,
                MaxFileSizeBytes);

        // Mở stream một lần duy nhất, đảm bảo seek về đầu giữa các bước
        await using var fileStream = command.File.OpenReadStream();

        // ── 4. Xác thực MIME type bằng magic bytes (BR-17) ────────────────────
        var mimeResult = _fileSecurity.ValidateMime(fileStream, AllowedMimeTypes);
        if (!mimeResult.IsAllowed)
            throw new InvalidMimeTypeException(command.File.FileName, mimeResult.DetectedMime);

        // Reset stream sau khi đọc magic bytes
        fileStream.Seek(0, SeekOrigin.Begin);

        // ── 5. Quét virus ClamAV ───────────────────────────────────────────────
        var scanResult = await _fileSecurity.ScanVirusAsync(fileStream, cancellationToken);
        if (!scanResult.IsClean)
            throw new VirusDetectedException(command.File.FileName, scanResult.VirusName);

        fileStream.Seek(0, SeekOrigin.Begin);

        // ── 6. Mã hoá AES-256-CBC ─────────────────────────────────────────────
        await using var encryptedStream = await _fileSecurity.EncryptAsync(fileStream);

        // ── 7. Đổi tên thành UUID và upload lên Storage ────────────────────────
        // StorageKey = UUID ngẫu nhiên → không tiết lộ tên file gốc
        var storageKey = $"assignments/{command.AssignmentId}/{Guid.NewGuid()}.enc";

        await _storage.UploadAsync(
            storageKey,
            encryptedStream,
            contentType: "application/octet-stream",
            cancellationToken: cancellationToken);

        // ── 8. Lưu metadata vào database ──────────────────────────────────────
        var submission = AssignmentSubmission.Create(
            assignmentId:     command.AssignmentId,
            studentId:        command.StudentId,           // lấy từ JWT Claims
            originalFileName: command.File.FileName,       // chỉ để hiển thị
            storageKey:       storageKey,                   // UUID key
            mimeType:         mimeResult.DetectedMime,     // đã xác minh bằng magic bytes
            fileSizeBytes:    command.File.Length);

        await _submissionRepo.AddAsync(submission, cancellationToken);

        return new SubmitAssignmentResponse
        {
            SubmissionId     = submission.SubmissionId,
            OriginalFileName = submission.OriginalFileName,
            MimeType         = submission.MimeType,
            FileSizeBytes    = submission.FileSizeBytes,
            SubmittedAt      = submission.SubmittedAt,
            StorageKey       = submission.StorageKey
        };
    }
}
