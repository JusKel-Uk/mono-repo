using onboarding.Contracts;

namespace onboarding.Core.Entities;

internal sealed class StepProgress
{
    public Guid ApplicationId { get; set; }

    public OnboardingStep Step { get; set; }

    public StepStatus Status { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Application Application { get; set; } = null!;
}