using System.Security.Claims;

namespace LMS.API.Extensions;

/// <summary>
/// Extension methods để trích xuất thông tin người dùng từ JWT Claims một cách an toàn.
///
/// NGUYÊN TẮC CHỐNG IDOR (Insecure Direct Object Reference):
///   - LUÔN lấy UserId từ JWT Claims ("sub"), TUYỆT ĐỐI KHÔNG lấy từ URL/query/body.
///   - LUÔN lấy Role từ JWT Claims ("role"), không tin bất kỳ input nào từ client.
///
/// Claim layout (set tại JwtTokenService):
///   - "sub"   → UserId (Guid)
///   - "email" → Email
///   - "role"  → UserRole enum string (Student | Instructor | Admin)
///   - "jti"   → JWT ID (dùng cho Blacklist khi logout)
/// </summary>
public static class ClaimsPrincipalExtensions
{
    // ── Claim name constants (phải khớp với JwtTokenService) ────────────────────
    public const string ClaimSub   = "sub";
    public const string ClaimRole  = "role";
    public const string ClaimEmail = "email";
    public const string ClaimJti   = "jti";

    // ── Role value constants ─────────────────────────────────────────────────────
    public const string RoleStudent    = "Student";
    public const string RoleInstructor = "Instructor";
    public const string RoleAdmin      = "Admin";

    /// <summary>
    /// Trích xuất UserId (Guid) từ claim "sub".
    /// Trả về null nếu claim không tồn tại hoặc không parse được thành Guid.
    /// TUYỆT ĐỐI KHÔNG dùng giá trị này nếu trả về null – trả 401 cho client.
    /// </summary>
    public static Guid? GetUserId(this ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(ClaimSub);
        return Guid.TryParse(sub, out var userId) ? userId : null;
    }

    /// <summary>
    /// Trích xuất UserId (Guid) từ claim "sub".
    /// Throw UnauthorizedAccessException nếu claim không tồn tại hoặc không hợp lệ.
    /// Dùng khi endpoint bắt buộc phải có authenticated user (đã qua [Authorize]).
    /// </summary>
    /// <exception cref="UnauthorizedAccessException">Claim "sub" không tồn tại hoặc không phải Guid.</exception>
    public static Guid GetRequiredUserId(this ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(ClaimSub);
        if (!Guid.TryParse(sub, out var userId))
            throw new UnauthorizedAccessException("Token không chứa UserId hợp lệ trong claim 'sub'.");
        return userId;
    }

    /// <summary>
    /// Trích xuất Email từ claim "email".
    /// </summary>
    public static string? GetEmail(this ClaimsPrincipal principal)
        => principal.FindFirstValue(ClaimEmail);

    /// <summary>
    /// Trích xuất JTI (JWT ID) từ claim "jti".
    /// Dùng để đẩy token vào Redis Blacklist khi logout.
    /// </summary>
    public static string? GetJti(this ClaimsPrincipal principal)
        => principal.FindFirstValue(ClaimJti);

    /// <summary>
    /// Trích xuất Role từ claim "role".
    /// </summary>
    public static string? GetRole(this ClaimsPrincipal principal)
        => principal.FindFirstValue(ClaimRole);

    /// <summary>Kiểm tra user có Role Student.</summary>
    public static bool IsStudent(this ClaimsPrincipal principal)
        => principal.FindFirstValue(ClaimRole) == RoleStudent;

    /// <summary>Kiểm tra user có Role Instructor.</summary>
    public static bool IsInstructor(this ClaimsPrincipal principal)
        => principal.FindFirstValue(ClaimRole) == RoleInstructor;

    /// <summary>Kiểm tra user có Role Admin.</summary>
    public static bool IsAdmin(this ClaimsPrincipal principal)
        => principal.FindFirstValue(ClaimRole) == RoleAdmin;
}
