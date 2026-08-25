namespace onboarding.Contracts;

// One row in the progress timeline (Company, Business, etc.)
public sealed record StepProgressDto(
    OnboardingStep Step,
    StepStatus Status,
    DateTime? UpdatedAt);

// GET /onboarding/applications/current
public sealed record ApplicationResponse(
    Guid ApplicationId,
    SubmissionStatus Status,
    int CompletedCount,
    int TotalSteps,
    bool CanSubmit,
    IReadOnlyList<StepProgressDto> Steps,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? SubmittedAt);

// POST /onboarding/applications → 201
public sealed record CreateApplicationResponse(Guid ApplicationId);