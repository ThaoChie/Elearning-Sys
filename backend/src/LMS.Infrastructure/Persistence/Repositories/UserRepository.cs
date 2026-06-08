using LMS.Domain.Entities;
using LMS.Domain.Interfaces;
using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LMS.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(AppDbContext db) : IUserRepository
{
    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Users.FindAsync([id], ct).AsTask();

    /// <summary>
    /// Tra cứu User theo Refresh Token hiện hành.
    /// Dùng cho Rotation + Reuse Detection.
    /// KHÔNG index RefreshToken → tìm kiếm full-scan (chấp nhận vì dùng ít).
    /// Production nên đánh filtered index trên cột RefreshToken.
    /// </summary>
    public Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken, ct);

    public async Task AddAsync(User user, CancellationToken ct = default) =>
        await db.Users.AddAsync(user, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);
}
