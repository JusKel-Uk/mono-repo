namespace onboarding.Contracts;

public sealed record SubmitApplicationResponse(
    Guid ApplicationId,
    SubmissionStatus Status,
    DateTime SubmittedAt);

public interface IOnboardingModule
{
    Task<Guid?> GetDraftApplicationIdAsync(
        Guid organisationId,
        CancellationToken ct = default);

    Task<Guid?> GetCurrentApplicationIdAsync(
        Guid organisationId,
        CancellationToken ct = default);

    Task MarkStepAsync(
        Guid applicationId,
        OnboardingStep step,
        StepStatus status,
        CancellationToken ct = default);

    Task<Guid?> GetOrganisationIdForApplicationAsync(
        Guid applicationId,
        CancellationToken ct = default);
}
