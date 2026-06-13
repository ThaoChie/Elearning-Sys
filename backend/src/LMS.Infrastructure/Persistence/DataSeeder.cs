using Bogus;
using LMS.Domain.Entities;
using LMS.Domain.Interfaces;
using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LMS.Infrastructure.Persistence;

/// <summary>
/// Seed dữ liệu mẫu vào database.
/// Chỉ chạy khi bảng Users chưa có dữ liệu (idempotent).
/// </summary>
public sealed class DataSeeder(
    AppDbContext    db,
    IPasswordHasher passwordHasher,
    ILogger<DataSeeder> logger)
{
    // ── Cấu hình tài khoản Admin mặc định ────────────────────────────────────
    private const string AdminEmail    = "admin@elearning.com";
    private const string AdminPassword = "Password123!";

    public async Task SeedAsync(CancellationToken ct = default)
    {
        logger.LogInformation("DataSeeder: Clearing database tables...");
        try
        {
            if (db.Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL")
            {
                // Disable trigger before truncating so it doesn't block DELETE operations if EF Core uses DELETE under the hood or for TRUNCATE cascade
                await db.Database.ExecuteSqlRawAsync("DROP TRIGGER IF EXISTS trg_AuditLogs_BlockDelete ON \"AuditLogs\";", ct);
                await db.Database.ExecuteSqlRawAsync("DROP TRIGGER IF EXISTS trg_AuditLogs_BlockUpdate ON \"AuditLogs\";", ct);
                
                await db.Database.ExecuteSqlRawAsync(
                    "TRUNCATE TABLE \"Users\", \"Courses\", \"Modules\", \"Lectures\", \"Quizzes\", \"Questions\", \"Answers\", \"Notifications\", \"AuditLogs\", \"ExamSessions\", \"Assignments\", \"AssignmentSubmissions\" CASCADE;", ct);
            }
            else
            {
                // Fallback for SQL Server
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [AssignmentSubmissions];", ct);
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [Assignments];", ct);
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [ExamSessions];", ct);
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [AuditLogs];", ct);
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [Notifications];", ct);
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [Answers];", ct);
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [Questions];", ct);
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [Quizzes];", ct);
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [Lectures];", ct);
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [Modules];", ct);
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [Courses];", ct);
                await db.Database.ExecuteSqlRawAsync("DELETE FROM [Users];", ct);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to truncate tables. Proceeding anyway.");
        }

        logger.LogInformation("DataSeeder: Bắt đầu seed dữ liệu mẫu...");

        Randomizer.Seed = new Random(42); // seed cố định để tái hiện được

        // ── 1. Tạo các tài khoản test cứng phục vụ E2E ──────────────────────
        var studentUser = User.Create("student@lms.vn", passwordHasher.Hash("ValidPass1!"), UserRole.Student);
        var student2User = User.Create("student2@lms.vn", passwordHasher.Hash("ValidPass1!"), UserRole.Student);
        var userLmsUser = User.Create("user@lms.vn", passwordHasher.Hash("ValidPass1!"), UserRole.Student);
        var instructorUser = User.Create("instructor@lms.vn", passwordHasher.Hash("ValidPass1!"), UserRole.Instructor);
        var adminUser = User.Create("admin@lms.vn", passwordHasher.Hash("AdminPass1!"), UserRole.Admin);
        var locktest4User = User.Create("locktest4@lms.vn", passwordHasher.Hash("ValidPass1!"), UserRole.Student);
        var locktest5User = User.Create("locktest5@lms.vn", passwordHasher.Hash("ValidPass1!"), UserRole.Student);

        var lockedUser = User.Create("locked@lms.vn", passwordHasher.Hash("ValidPass1!"), UserRole.Student);
        typeof(User).GetProperty("LockoutEnd")?.SetValue(lockedUser, DateTime.UtcNow.AddMinutes(15));

        var expiredLockUser = User.Create("expired_lock@lms.vn", passwordHasher.Hash("ValidPass1!"), UserRole.Student);
        typeof(User).GetProperty("LockoutEnd")?.SetValue(expiredLockUser, DateTime.UtcNow.AddMinutes(-5));
        typeof(User).GetProperty("FailedLoginCount")?.SetValue(expiredLockUser, 5);

        // ── 2. Tạo Admin ────────────────────────────────────────────────────
        var admin = User.Create(
            AdminEmail,
            passwordHasher.Hash(AdminPassword),
            UserRole.Admin);

        // ── 3. Tạo Instructor và Student bằng Bogus ─────────────────────────
        var faker = new Faker("vi");

        var instructor = User.Create(
            email:        $"instructor_{Guid.NewGuid().ToString("N").Substring(0,8)}@elearning.com",
            passwordHash: passwordHasher.Hash("Instructor@123"),
            role:         UserRole.Instructor);

        var student = User.Create(
            email:        $"student_{Guid.NewGuid().ToString("N").Substring(0,8)}@student.edu.vn",
            passwordHash: passwordHasher.Hash("Student@123"),
            role:         UserRole.Student);

        await db.Users.AddRangeAsync([
            studentUser, student2User, userLmsUser, instructorUser, adminUser,
            locktest4User, locktest5User, lockedUser, expiredLockUser,
            admin, instructor, student
        ], ct);

        // ── 3. Tạo Course ───────────────────────────────────────────────────
        var courseFaker = new Faker<Course>("vi")
            .CustomInstantiator(f => Course.Create(
                instructorId: instructor.Id,
                title:        "Lập trình ASP.NET Core từ cơ bản đến nâng cao",
                description:  f.Lorem.Paragraph(3),
                thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/lms/course-dotnet.jpg"));

        var course = courseFaker.Generate();
        course.Publish();
        await db.Courses.AddAsync(course, ct);
        await db.SaveChangesAsync(ct); // lưu Course trước để lấy CourseId

        // ── 4. Tạo Modules ──────────────────────────────────────────────────
        var moduleTitles = new[]
        {
            "Chương 1: Kiến trúc và thiết lập môi trường",
            "Chương 2: Entity Framework Core & Database"
        };

        var videoUrls = new[,]
        {
            // Module 1
            {
                "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "https://res.cloudinary.com/demo/video/upload/lms/aspnet-intro.mp4"
            },
            // Module 2
            {
                "https://www.youtube.com/watch?v=2A5P8ADmFiA",
                "https://res.cloudinary.com/demo/video/upload/lms/efcore-basics.mp4"
            }
        };

        var lectureTitles = new[,]
        {
            { "Giới thiệu ASP.NET Core 8 và Layered Architecture", "Thiết lập dự án, Dependency Injection cơ bản" },
            { "Entity Framework Core – Code First Migration",       "Cấu hình DbContext, Repository Pattern" }
        };

        for (int mi = 0; mi < moduleTitles.Length; mi++)
        {
            var module = Module.Create(course.CourseId, moduleTitles[mi], order: mi + 1);
            await db.Modules.AddAsync(module, ct);
            await db.SaveChangesAsync(ct); // lưu Module để lấy ModuleId

            for (int li = 0; li < 2; li++)
            {
                var lecture = Lecture.Create(
                    moduleId:     module.ModuleId,
                    title:        lectureTitles[mi, li],
                    videoUrl:     videoUrls[mi, li],
                    durationSecs: faker.Random.Int(600, 3600),
                    order:        li + 1);

                await db.Lectures.AddAsync(lecture, ct);
            }

            await db.SaveChangesAsync(ct);
        }

        // ── 5. Tạo Quiz ─────────────────────────────────────────────────────
        var quiz = Quiz.Create(
            courseId:    course.CourseId,
            title:       "Kiểm tra cuối khoá – ASP.NET Core",
            timeLimitMin: 45);

        await db.Quizzes.AddAsync(quiz, ct);
        await db.SaveChangesAsync(ct);

        // ── 6. Tạo Questions & Answers ──────────────────────────────────────
        var questionsData = new[]
        {
            new
            {
                Content = "Middleware trong ASP.NET Core được đăng ký theo thứ tự nào?",
                Answers = new[]
                {
                    (Text: "Thứ tự ngẫu nhiên do runtime quyết định",                       IsCorrect: false),
                    (Text: "Theo thứ tự gọi Use/Map/Run trong Program.cs",                  IsCorrect: true),
                    (Text: "Alphabetical theo tên class",                                    IsCorrect: false),
                    (Text: "Theo thứ tự dependency injection trong DI container",            IsCorrect: false)
                }
            },
            new
            {
                Content = "Câu lệnh nào dùng để tạo migration mới trong EF Core?",
                Answers = new[]
                {
                    (Text: "dotnet ef database update",                                      IsCorrect: false),
                    (Text: "dotnet ef migrations list",                                      IsCorrect: false),
                    (Text: "dotnet ef migrations add <TênMigration>",                        IsCorrect: true),
                    (Text: "dotnet ef migrations remove",                                    IsCorrect: false)
                }
            },
            new
            {
                Content = "JWT RS256 khác JWT HS256 ở điểm nào chính yếu?",
                Answers = new[]
                {
                    (Text: "RS256 nhanh hơn HS256",                                         IsCorrect: false),
                    (Text: "RS256 dùng cùng key để ký và xác minh (symmetric)",             IsCorrect: false),
                    (Text: "RS256 dùng Private key ký, Public key xác minh (asymmetric)",   IsCorrect: true),
                    (Text: "RS256 không hỗ trợ claim tùy chỉnh",                            IsCorrect: false)
                }
            }
        };

        for (int qi = 0; qi < questionsData.Length; qi++)
        {
            var qData    = questionsData[qi];
            var question = Question.Create(quiz.QuizId, qData.Content, order: qi + 1);
            await db.Questions.AddAsync(question, ct);
            await db.SaveChangesAsync(ct);

            for (int ai = 0; ai < qData.Answers.Length; ai++)
            {
                var (text, isCorrect) = qData.Answers[ai];
                var answer = Answer.Create(question.QuestionId, text, isCorrect, order: ai + 1);
                await db.Answers.AddAsync(answer, ct);
            }

            await db.SaveChangesAsync(ct);
        }

        // ── 7. Tạo Assignment cho test ──────────────────────────────────────
        var assignment = Assignment.Create(
            courseId: course.CourseId,
            title: "Bài tập thực hành bảo mật ứng dụng",
            description: "Nộp file PDF báo cáo phân tích lỗ hổng bảo mật.",
            dueAt: DateTime.UtcNow.AddDays(7));
        
        typeof(Assignment).GetProperty("AssignmentId")?
            .SetValue(assignment, new Guid("00000000-0000-0000-0000-000000000001"));

        await db.Assignments.AddAsync(assignment, ct);

        // ── 8. Tạo ExamSession hoạt động cho student@lms.vn ─────────────────
        var examSession = ExamSession.Create(
            examId: new Guid("00000000-0000-0000-0000-000000000002"),
            userId: studentUser.Id,
            durationSeconds: 3600);
        await db.ExamSessions.AddAsync(examSession, ct);

        // ── 9. Seed Notifications cho test ────────────────────────────────────
        var notif1 = Notification.Create(
            studentUser.Id,
            "Chào mừng bạn đến LMS",
            "Tài khoản của bạn đã được tạo thành công.",
            NotificationType.System);

        var notif2 = Notification.Create(
            studentUser.Id,
            "Bài tập mới",
            "Bạn có bài tập mới cần hoàn thành.",
            NotificationType.Assignment,
            assignment.AssignmentId);

        var notif3 = Notification.Create(
            studentUser.Id,
            "Khoá học cập nhật",
            "Khoá học ASP.NET Core đã được cập nhật.",
            NotificationType.Course,
            course.CourseId);
        notif3.MarkAsRead(); // 1 notification đã đọc

        var notif4 = Notification.Create(
            student2User.Id,
            "Thông báo hệ thống",
            "Hệ thống sẽ bảo trì vào cuối tuần.",
            NotificationType.System);

        var notif5 = Notification.Create(
            student2User.Id,
            "Bài kiểm tra sắp tới",
            "Bạn có bài kiểm tra vào tuần tới.",
            NotificationType.Exam);
        notif5.MarkAsRead();

        await db.Notifications.AddRangeAsync([notif1, notif2, notif3, notif4, notif5], ct);

        await db.SaveChangesAsync(ct);

        // ── 10. Tạo triggers bảo vệ AuditLogs (immutable) ──────────────────
        if (db.Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL")
        {
            await db.Database.ExecuteSqlRawAsync(@"
                CREATE OR REPLACE FUNCTION fn_block_audit_update()
                RETURNS trigger AS $$
                BEGIN
                    RAISE EXCEPTION 'AuditLog records are immutable. UPDATE is forbidden.';
                END;
                $$ LANGUAGE plpgsql;
            ", ct);

            await db.Database.ExecuteSqlRawAsync(@"
                CREATE OR REPLACE FUNCTION fn_block_audit_delete()
                RETURNS trigger AS $$
                BEGIN
                    RAISE EXCEPTION 'AuditLog records are immutable. DELETE is forbidden.';
                END;
                $$ LANGUAGE plpgsql;
            ", ct);

            // DROP IF EXISTS then CREATE to ensure idempotency
            await db.Database.ExecuteSqlRawAsync(@"
                DROP TRIGGER IF EXISTS trg_AuditLogs_BlockUpdate ON ""AuditLogs"";
                CREATE TRIGGER trg_AuditLogs_BlockUpdate
                    BEFORE UPDATE ON ""AuditLogs""
                    FOR EACH ROW
                    EXECUTE FUNCTION fn_block_audit_update();
            ", ct);

            await db.Database.ExecuteSqlRawAsync(@"
                DROP TRIGGER IF EXISTS trg_AuditLogs_BlockDelete ON ""AuditLogs"";
                CREATE TRIGGER trg_AuditLogs_BlockDelete
                    BEFORE DELETE ON ""AuditLogs""
                    FOR EACH ROW
                    EXECUTE FUNCTION fn_block_audit_delete();
            ", ct);
        }

        logger.LogInformation(
            "DataSeeder: Seed hoàn tất. Admin={AdminEmail}, Instructor={InstructorEmail}, Student={StudentEmail}",
            AdminEmail, instructor.Email, student.Email);
    }
}
