using LMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LMS.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(512); // Argon2id encoded string tối đa ~200 chars

        builder.Property(u => u.FailedLoginCount)
            .HasDefaultValue(0);

        builder.Property(u => u.RefreshToken)
            .HasMaxLength(64); // UUID "N" format = 32 chars

        // Role: lưu dưới dạng string ("Student" | "Instructor" | "Admin") để dễ đọc trong DB.
        // Mặc định Student để đảm bảo Least Privilege khi tạo tài khoản.
        builder.Property(u => u.Role)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(UserRole.Student);

        builder.Property(u => u.CreatedAt)
            .IsRequired();
    }
}
