using FluentValidation;
using LMS.Domain.Exceptions;

namespace LMS.API.Middlewares;

/// <summary>
/// Middleware bắt các exception domain và trả về HTTP response có cấu trúc.
///
/// Xử lý:
/// - <see cref="ValidationException"/>    → 400 Bad Request
/// - <see cref="FileSizeExceededException"/> → 400 Bad Request
/// - <see cref="InvalidMimeTypeException"/>  → 422 Unprocessable Entity
/// - <see cref="VirusDetectedException"/>    → 422 Unprocessable Entity
/// </summary>
public sealed class ValidationExceptionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode  = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray()
                );

            await context.Response.WriteAsJsonAsync(new
            {
                error   = "validation_failed",
                message = "Dữ liệu đầu vào không hợp lệ.",
                errors
            });
        }
        catch (FileSizeExceededException ex)
        {
            context.Response.StatusCode  = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                error    = "file_too_large",
                message  = ex.Message,
                actualMb = ex.ActualBytes / 1_048_576.0,
                maxMb    = ex.MaxBytes    / 1_048_576.0
            });
        }
        catch (InvalidMimeTypeException ex)
        {
            context.Response.StatusCode  = StatusCodes.Status422UnprocessableEntity;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                error        = "invalid_mime_type",
                message      = ex.Message,
                detectedMime = ex.DetectedMime
            });
        }
        catch (VirusDetectedException ex)
        {
            context.Response.StatusCode  = StatusCodes.Status422UnprocessableEntity;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                error     = "virus_detected",
                message   = ex.Message,
                virusName = ex.VirusName
            });
        }
    }
}
