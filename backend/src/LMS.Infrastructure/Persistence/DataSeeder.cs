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
        // Idempotent guard – không seed nếu DB đã có dữ liệu
        if (await db.Users.AnyAsync(ct))
        {
            logger.LogInformation("DataSeeder: Database đã có dữ liệu, bỏ qua seed.");
            return;
        }

        logger.LogInformation("DataSeeder: Bắt đầu seed dữ liệu mẫu...");

        Randomizer.Seed = new Random(42); // seed cố định để tái hiện được

        // ── 1. Tạo Admin ────────────────────────────────────────────────────
        var admin = User.Create(
            AdminEmail,
            passwordHasher.Hash(AdminPassword),
            UserRole.Admin);

        // ── 2. Tạo Instructor và Student bằng Bogus ─────────────────────────
        var faker = new Faker("vi");

        var instructor = User.Create(
            email:        faker.Internet.Email(provider: "elearning.com"),
            passwordHash: passwordHasher.Hash("Instructor@123"),
            role:         UserRole.Instructor);

        var student = User.Create(
            email:        faker.Internet.Email(provider: "student.edu.vn"),
            passwordHash: passwordHasher.Hash("Student@123"),
            role:         UserRole.Student);

        await db.Users.AddRangeAsync([admin, instructor, student], ct);

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

        logger.LogInformation(
            "DataSeeder: Seed hoàn tất. Admin={AdminEmail}, Instructor={InstructorEmail}, Student={StudentEmail}",
            AdminEmail, instructor.Email, student.Email);
    }
}
