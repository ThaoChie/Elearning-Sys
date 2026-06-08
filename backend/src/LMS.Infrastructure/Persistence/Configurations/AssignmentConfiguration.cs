using LMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LMS.Infrastructure.Persistence.Configurations;

public sealed class AssignmentConfiguration : IEntityTypeConfiguration<Assignment>
{
    public void Configure(EntityTypeBuilder<Assignment> builder)
    {
        builder.ToTable("Assignments");

        builder.HasKey(a => a.AssignmentId);

        builder.Property(a => a.CourseId)
            .IsRequired();

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(a => a.Description)
            .HasMaxLength(4000);

        builder.Property(a => a.DueAt)
            .IsRequired();

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        // Index để tra cứu bài tập theo khoá học
        builder.HasIndex(a => a.CourseId);
    }
}

public sealed class AssignmentSubmissionConfiguration : IEntityTypeConfiguration<AssignmentSubmission>
{
    public void Configure(EntityTypeBuilder<AssignmentSubmission> builder)
    {
        builder.ToTable("AssignmentSubmissions");

        builder.HasKey(s => s.SubmissionId);

        builder.Property(s => s.AssignmentId)
            .IsRequired();

        builder.Property(s => s.StudentId)
            .IsRequired();

        builder.Property(s => s.OriginalFileName)
            .IsRequired()
            .HasMaxLength(512);  // Tên file gốc (chỉ hiển thị)

        builder.Property(s => s.StorageKey)
            .IsRequired()
            .HasMaxLength(512);  // "assignments/{id}/{uuid}.enc"

        builder.Property(s => s.MimeType)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(s => s.FileSizeBytes)
            .IsRequired();

        builder.Property(s => s.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(s => s.SubmittedAt)
            .IsRequired();

        // BR-16: Mỗi sinh viên chỉ nộp một lần cho mỗi bài tập
        builder.HasIndex(s => new { s.AssignmentId, s.StudentId })
            .IsUnique()
            .HasDatabaseName("UX_AssignmentSubmission_AssignmentId_StudentId");

        // Index để truy vấn tất cả bài nộp của một bài tập
        builder.HasIndex(s => s.AssignmentId);
    }
}
