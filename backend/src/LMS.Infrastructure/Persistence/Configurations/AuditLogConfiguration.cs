using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LMS.Domain.Entities;

namespace LMS.Infrastructure.Persistence.Configurations;

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");

        builder.HasKey(x => x.LogID);

        builder.Property(x => x.LogID)
            .ValueGeneratedNever();

        builder.Property(x => x.Timestamp)
            .IsRequired()
            .HasColumnType("datetimeoffset(7)");

        builder.Property(x => x.ActorID)
            .HasMaxLength(128);

        builder.Property(x => x.Action)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(x => x.IP)
            .HasMaxLength(45); // IPv6 max length

        builder.Property(x => x.HMACSignature)
            .IsRequired()
            .HasMaxLength(88); // Base64(SHA256) = 44 chars; HMAC-SHA256 hex = 64 chars

        // Index để query nhanh theo ActorID và Timestamp
        builder.HasIndex(x => x.ActorID);
        builder.HasIndex(x => x.Timestamp);

        // Chặn hoàn toàn UPDATE/DELETE ở database level
        builder.ToTable(tb =>
        {
            tb.HasTrigger("trg_AuditLogs_BlockUpdate");
            tb.HasTrigger("trg_AuditLogs_BlockDelete");
        });
    }
}
