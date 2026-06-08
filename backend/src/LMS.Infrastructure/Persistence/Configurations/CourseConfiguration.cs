using LMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LMS.Infrastructure.Persistence.Configurations;

public sealed class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.HasKey(c => c.CourseId);

        builder.Property(c => c.Title)
               .HasMaxLength(300)
               .IsRequired();

        builder.Property(c => c.Description)
               .HasMaxLength(2000);

        builder.Property(c => c.ThumbnailUrl)
               .HasMaxLength(1000);

        builder.HasMany(c => c.Modules)
               .WithOne(m => m.Course)
               .HasForeignKey(m => m.CourseId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Quizzes)
               .WithOne(q => q.Course)
               .HasForeignKey(q => q.CourseId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("Courses");
    }
}

public sealed class ModuleConfiguration : IEntityTypeConfiguration<Module>
{
    public void Configure(EntityTypeBuilder<Module> builder)
    {
        builder.HasKey(m => m.ModuleId);

        builder.Property(m => m.Title)
               .HasMaxLength(300)
               .IsRequired();

        builder.HasMany(m => m.Lectures)
               .WithOne(l => l.Module)
               .HasForeignKey(l => l.ModuleId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("Modules");
    }
}

public sealed class LectureConfiguration : IEntityTypeConfiguration<Lecture>
{
    public void Configure(EntityTypeBuilder<Lecture> builder)
    {
        builder.HasKey(l => l.LectureId);

        builder.Property(l => l.Title)
               .HasMaxLength(300)
               .IsRequired();

        // VideoUrl lưu internal path – không expose ra ngoài
        builder.Property(l => l.VideoUrl)
               .HasMaxLength(2000)
               .IsRequired();

        builder.ToTable("Lectures");
    }
}

public sealed class QuizConfiguration : IEntityTypeConfiguration<Quiz>
{
    public void Configure(EntityTypeBuilder<Quiz> builder)
    {
        builder.HasKey(q => q.QuizId);

        builder.Property(q => q.Title)
               .HasMaxLength(300)
               .IsRequired();

        builder.HasMany(q => q.Questions)
               .WithOne(qu => qu.Quiz)
               .HasForeignKey(qu => qu.QuizId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("Quizzes");
    }
}

public sealed class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.HasKey(q => q.QuestionId);

        builder.Property(q => q.Content)
               .HasMaxLength(1000)
               .IsRequired();

        builder.HasMany(q => q.Answers)
               .WithOne(a => a.Question)
               .HasForeignKey(a => a.QuestionId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("Questions");
    }
}

public sealed class AnswerConfiguration : IEntityTypeConfiguration<Answer>
{
    public void Configure(EntityTypeBuilder<Answer> builder)
    {
        builder.HasKey(a => a.AnswerId);

        builder.Property(a => a.Content)
               .HasMaxLength(500)
               .IsRequired();

        // IsCorrect – cột này không bao giờ được SELECT trong query trả về client
        builder.Property(a => a.IsCorrect)
               .IsRequired();

        builder.ToTable("Answers");
    }
}
