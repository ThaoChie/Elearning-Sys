using LMS.Domain.Entities;

namespace LMS.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Tìm User theo Refresh Token hiện hành (dùng cho Rotation + Reuse Detection).
    /// </summary>
    Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken ct = default);

    Task AddAsync(User user, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
