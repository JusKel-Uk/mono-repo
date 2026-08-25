using onboarding.Contracts;

namespace onboarding.Core.Entities;

internal sealed class Application
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public SubmissionStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public ICollection<StepProgress> Steps { get; set; } = [];

    public CompanySetup? CompanySetup { get; set; }

    public BusinessProfile? BusinessProfile { get; set; }
}