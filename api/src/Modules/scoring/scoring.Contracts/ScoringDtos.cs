namespace scoring.Contracts;

public sealed record SustainabilityProfileResponse(
    Guid ApplicationId,
    SustainabilityAnswer GhgEmissions,
    SustainabilityAnswer SustainabilityPolicy,
    SustainabilityAnswer ResourceTracking,
    SustainabilityAnswer Wellbeing,
    SustainabilityAnswer Training,
    SustainabilityAnswer Dei,
    SustainabilityAnswer Continuity,
    SustainabilityAnswer GovernancePolicies,
    SustainabilityAnswer RiskReview,
    IReadOnlyList<SustainabilityEvidenceResponse> Evidence,
    DateTime UpdatedAt);

public sealed record UpsertSustainabilityProfileRequest(
    SustainabilityAnswer GhgEmissions,
    SustainabilityAnswer SustainabilityPolicy,
    SustainabilityAnswer ResourceTracking,
    SustainabilityAnswer Wellbeing,
    SustainabilityAnswer Training,
    SustainabilityAnswer Dei,
    SustainabilityAnswer Continuity,
    SustainabilityAnswer GovernancePolicies,
    SustainabilityAnswer RiskReview);

public sealed record SustainabilityEvidenceResponse(
    Guid EvidenceId,
    Guid ApplicationId,
    SustainabilityQuestionKey QuestionKey,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    DateTime UploadedAt);

public interface IScoringModule
{
    Task<bool> IsStepCompleteAsync(Guid applicationId, CancellationToken ct = default);
}
