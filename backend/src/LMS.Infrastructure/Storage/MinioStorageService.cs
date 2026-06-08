using LMS.Domain.Interfaces;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace LMS.Infrastructure.Storage;

/// <summary>
/// Triển khai <see cref="IStorageService"/> dùng MinIO S3-compatible API.
///
/// Bucket được tạo tự động nếu chưa tồn tại khi ứng dụng khởi động.
/// </summary>
public sealed class MinioStorageService : IStorageService
{
    private readonly IMinioClient  _minioClient;
    private readonly StorageOptions _opts;

    public MinioStorageService(IMinioClient minioClient, IOptions<StorageOptions> opts)
    {
        _minioClient = minioClient;
        _opts        = opts.Value;
    }

    /// <inheritdoc/>
    public async Task UploadAsync(
        string            key,
        Stream            contentStream,
        string?           contentType       = null,
        CancellationToken cancellationToken  = default)
    {
        await EnsureBucketExistsAsync(cancellationToken);

        var putArgs = new PutObjectArgs()
            .WithBucket(_opts.BucketName)
            .WithObject(key)
            .WithStreamData(contentStream)
            .WithObjectSize(contentStream.Length)
            .WithContentType(contentType ?? "application/octet-stream");

        await _minioClient.PutObjectAsync(putArgs, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<Stream> DownloadAsync(
        string            key,
        CancellationToken cancellationToken = default)
    {
        var ms = new MemoryStream();

        var getArgs = new GetObjectArgs()
            .WithBucket(_opts.BucketName)
            .WithObject(key)
            .WithCallbackStream(async (stream, ct) =>
            {
                await stream.CopyToAsync(ms, ct);
            });

        await _minioClient.GetObjectAsync(getArgs, cancellationToken);

        ms.Seek(0, SeekOrigin.Begin);
        return ms;
    }

    /// <inheritdoc/>
    public async Task DeleteAsync(
        string            key,
        CancellationToken cancellationToken = default)
    {
        var removeArgs = new RemoveObjectArgs()
            .WithBucket(_opts.BucketName)
            .WithObject(key);

        await _minioClient.RemoveObjectAsync(removeArgs, cancellationToken);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /// <summary>Đảm bảo bucket tồn tại, tạo mới nếu chưa có.</summary>
    private async Task EnsureBucketExistsAsync(CancellationToken cancellationToken)
    {
        var beArgs = new BucketExistsArgs().WithBucket(_opts.BucketName);
        var exists = await _minioClient.BucketExistsAsync(beArgs, cancellationToken);

        if (!exists)
        {
            var mbArgs = new MakeBucketArgs().WithBucket(_opts.BucketName);
            await _minioClient.MakeBucketAsync(mbArgs, cancellationToken);
        }
    }
}
