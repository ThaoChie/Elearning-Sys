using LMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace LMS.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User>                 Users                 => Set<User>();
    public DbSet<ExamSession>          ExamSessions          => Set<ExamSession>();
    public DbSet<Assignment>           Assignments           => Set<Assignment>();
    public DbSet<AssignmentSubmission> AssignmentSubmissions => Set<AssignmentSubmission>();
    public DbSet<AuditLog>             AuditLogs             => Set<AuditLog>();

    // ── Course domain ─────────────────────────────────────────────────────────
    public DbSet<Course>   Courses   => Set<Course>();
    public DbSet<Module>   Modules   => Set<Module>();
    public DbSet<Lecture>  Lectures  => Set<Lecture>();
    public DbSet<Quiz>     Quizzes   => Set<Quiz>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Answer>   Answers   => Set<Answer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        ThrowIfAuditLogMutated();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ThrowIfAuditLogMutated();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    // Defense-in-depth: chặn trước khi chạm đến DB trigger
    private void ThrowIfAuditLogMutated()
    {
        foreach (EntityEntry entry in ChangeTracker.Entries<AuditLog>())
        {
            if (entry.State is EntityState.Modified or EntityState.Deleted)
                throw new InvalidOperationException(
                    "AuditLog records are immutable. UPDATE and DELETE operations are forbidden.");
        }
    }
}
