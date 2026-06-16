namespace LMS.Domain.Entities;

public class CourseEnrollment
{
    public Guid CourseId { get; private set; }
    public Guid StudentId { get; private set; }
    public DateTime EnrolledAt { get; private set; }

    private CourseEnrollment() { }

    public static CourseEnrollment Create(Guid courseId, Guid studentId)
    {
        return new CourseEnrollment
        {
            CourseId = courseId,
            StudentId = studentId,
            EnrolledAt = DateTime.UtcNow
        };
    }
}
