using LMS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/test")]
public class TestController(DataSeeder seeder, AppDbContext db) : ControllerBase
{
    private static readonly SemaphoreSlim _resetLock = new SemaphoreSlim(1, 1);

    [HttpPost("reset-db")]
    public async Task<IActionResult> ResetDb()
    {
        await _resetLock.WaitAsync();
        try
        {
            await seeder.SeedAsync();
            return Ok(new { message = "Database reset successfully." });
        }
        finally
        {
            _resetLock.Release();
        }
    }

    /// <summary>
    /// Trả về audit logs gần nhất kèm HMAC secret key (chỉ dùng trong test).
    /// </summary>
    [HttpGet("audit-logs/recent")]
    public async Task<IActionResult> GetRecentAuditLogs([FromQuery] int count = 5)
    {
        var logs = await db.Set<LMS.Domain.Entities.AuditLog>()
            .OrderByDescending(x => x.Timestamp)
            .Take(count)
            .Select(x => new
            {
                x.LogID,
                Timestamp = x.Timestamp.ToString("O"),
                x.ActorID,
                x.Action,
                x.IP,
                x.HMACSignature
            })
            .ToListAsync();

        // Trả HMAC key cho test verification
        var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var hmacKey = config["AuditLog:HmacSecretKeyBase64"];

        return Ok(new { hmacKey, logs });
    }

    /// <summary>
    /// Thử UPDATE audit log bằng raw SQL — trả về blocked=true nếu trigger chặn.
    /// </summary>
    [HttpPost("audit-logs/try-update/{id}")]
    public async Task<IActionResult> TryUpdateAuditLog(Guid id)
    {
        try
        {
            var affected = await db.Database.ExecuteSqlRawAsync(
                "UPDATE \"AuditLogs\" SET \"Action\" = 'TAMPERED' WHERE \"LogID\" = {0}", id);
            return Ok(new { blocked = false, affected });
        }
        catch (Exception ex)
        {
            return Ok(new { blocked = true, error = ex.InnerException?.Message ?? ex.Message });
        }
    }

    /// <summary>
    /// Thử DELETE audit log bằng raw SQL — trả về blocked=true nếu trigger chặn.
    /// </summary>
    [HttpPost("audit-logs/try-delete/{id}")]
    public async Task<IActionResult> TryDeleteAuditLog(Guid id)
    {
        try
        {
            var affected = await db.Database.ExecuteSqlRawAsync(
                "DELETE FROM \"AuditLogs\" WHERE \"LogID\" = {0}", id);
            return Ok(new { blocked = false, affected });
        }
        catch (Exception ex)
        {
            return Ok(new { blocked = true, error = ex.InnerException?.Message ?? ex.Message });
        }
    }
}
