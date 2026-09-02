namespace onboarding.Contracts;

public sealed record SubmitApplicationResponse(
    Guid ApplicationId,
    SubmissionStatus Status,
    DateTime SubmittedAt);

public interface IOnboardingModule
{
    Task<Guid?> GetDraftApplicationIdAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Most recent application for the user (draft or submitted), for read-only step GETs.</summary>
    Task<Guid?> GetCurrentApplicationIdAsync(Guid userId, CancellationToken ct = default);

    Task MarkStepAsync(
        Guid applicationId,
        OnboardingStep step,
        StepStatus status,
        CancellationToken ct = default);
}
