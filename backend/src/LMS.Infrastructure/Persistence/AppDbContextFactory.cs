using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace LMS.Infrastructure.Persistence;

/// <summary>
/// Chỉ dùng cho EF Core CLI (dotnet ef migrations add / database update).
/// Đọc connection string từ biến môi trường ConnectionStrings__DefaultConnection.
/// KHÔNG được dùng trong runtime.
/// </summary>
public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connStr = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        if (string.IsNullOrWhiteSpace(connStr))
            throw new InvalidOperationException(
                "Set biến môi trường 'ConnectionStrings__DefaultConnection' trước khi chạy EF CLI. " +
                "Ví dụ: export ConnectionStrings__DefaultConnection=\"Host=...;Database=...;Username=...;Password=...\"");

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(
            connStr,
            npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName));

        return new AppDbContext(optionsBuilder.Options);
    }
}
