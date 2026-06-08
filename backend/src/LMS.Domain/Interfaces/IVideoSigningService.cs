namespace LMS.Domain.Interfaces;

/// <summary>
/// Dịch vụ sinh và xác thực Signed URL cho nội dung video bài giảng.
/// Signed URL được bảo vệ bằng HMAC-SHA256, có hạn sử dụng 4 giờ.
/// </summary>
public interface IVideoSigningService
{
    /// <summary>
    /// Sinh Signed URL cho một video. URL chứa chữ ký HMAC-SHA256 của
    /// (videoPath + userId + expires) để chống giả mạo và chia sẻ link.
    /// </summary>
    /// <param name="videoPath">Đường dẫn tương đối của video trong storage (VD: "courses/123/lesson-1.mp4").</param>
    /// <param name="userId">ID người dùng đang yêu cầu – dùng để bind URL với user.</param>
    /// <param name="ttl">Thời gian sống của URL. Mặc định 4 giờ.</param>
    /// <returns>Signed URL hoàn chỉnh có thể trả về cho client.</returns>
    string GenerateSignedUrl(string videoPath, Guid userId, TimeSpan? ttl = null);

    /// <summary>
    /// Xác thực Signed URL: kiểm tra chữ ký và thời gian hết hạn.
    /// Gọi trước khi proxy/stream video về cho client.
    /// </summary>
    /// <param name="videoPath">Path gốc của video (không encode).</param>
    /// <param name="userId">UserID từ JWT Claims – KHÔNG lấy từ query string.</param>
    /// <param name="expires">Unix timestamp hết hạn (lấy từ query string).</param>
    /// <param name="signature">Chữ ký HMAC-SHA256 (lấy từ query string).</param>
    /// <returns><c>true</c> nếu URL hợp lệ và chưa hết hạn.</returns>
    bool ValidateSignedUrl(string videoPath, Guid userId, long expires, string signature);
}
