using LMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LMS.Infrastructure.Persistence.Configurations;

public sealed class ExamSessionConfiguration : IEntityTypeConfiguration<ExamSession>
{
    public void Configure(EntityTypeBuilder<ExamSession> builder)
    {
        builder.ToTable("ExamSessions");

        builder.HasKey(s => s.SessionId);

        builder.Property(s => s.ExamId)
            .IsRequired();

        builder.Property(s => s.UserId)
            .IsRequired();

        builder.Property(s => s.StartAt)
            .IsRequired();

        builder.Property(s => s.DurationSeconds)
            .IsRequired();

        builder.Property(s => s.ViolationCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(s => s.Status)
            .IsRequired()
            .HasConversion<string>()   // lưu dạng "Active", "ForceSubmitted"… dễ đọc trong DB
            .HasMaxLength(32);

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        // ── Indexes ──────────────────────────────────────────────────────────

        // Ownership check query: WHERE ExamId = ? AND UserId = ? AND Status = 'Active'
        builder.HasIndex(s => new { s.ExamId, s.UserId, s.Status })
            .HasDatabaseName("IX_ExamSessions_ExamId_UserId_Status");
    }
}
