namespace LMS.Domain.Entities;

/// <summary>
/// Bài giảng (video) trong một Module.
/// VideoUrl là Signed URL gốc – KHÔNG bao giờ expose trực tiếp ra client.
/// Phân phối qua HmacVideoSigningService với TTL tối đa 4 giờ.
/// </summary>
public class Lecture
{
    public Guid     LectureId    { get; private set; }
    public Guid     ModuleId     { get; private set; }
    public string   Title        { get; private set; } = string.Empty;

    /// <summary>
    /// URL nội bộ (YouTube/Cloudinary/MinIO). KHÔNG gửi thẳng ra client.
    /// </summary>
    public string   VideoUrl     { get; private set; } = string.Empty;

    /// <summary>Thời lượng video tính bằng giây.</summary>
    public int      DurationSecs { get; private set; }
    public int      Order        { get; private set; }
    public DateTime CreatedAt    { get; private set; }

    // EF Core navigation
    public Module Module { get; private set; } = null!;

    private Lecture() { }

    public static Lecture Create(Guid moduleId, string title, string videoUrl, int durationSecs, int order)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(videoUrl);

        return new Lecture
        {
            LectureId    = Guid.NewGuid(),
            ModuleId     = moduleId,
            Title        = title.Trim(),
            VideoUrl     = videoUrl,
            DurationSecs = durationSecs,
            Order        = order,
            CreatedAt    = DateTime.UtcNow
        };
    }
}
