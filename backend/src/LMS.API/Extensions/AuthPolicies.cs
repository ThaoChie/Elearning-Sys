namespace LMS.API.Extensions;

/// <summary>
/// Tên các Authorization Policy dùng trong [Authorize(Policy = ...)] attribute.
/// Tập trung vào một nơi để tránh lỗi typo và dễ maintain.
/// </summary>
public static class AuthPolicies
{
    /// <summary>Chỉ Student được truy cập.</summary>
    public const string StudentOnly = "StudentOnly";

    /// <summary>Chỉ Instructor được truy cập.</summary>
    public const string InstructorOnly = "InstructorOnly";

    /// <summary>Chỉ Admin được truy cập.</summary>
    public const string AdminOnly = "AdminOnly";

    /// <summary>Instructor hoặc Admin (quản lý nội dung, chấm bài).</summary>
    public const string InstructorOrAdmin = "InstructorOrAdmin";

    /// <summary>Bất kỳ user đã xác thực (Student | Instructor | Admin).</summary>
    public const string AnyAuthenticated = "AnyAuthenticated";
}
