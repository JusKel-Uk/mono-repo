namespace scoring.Contracts;

public sealed record SustainabilityProfileResponse(
    Guid ApplicationId,
    SustainabilityAnswer EnergyEfficiency,
    SustainabilityAnswer WasteReduction,
    SustainabilityAnswer CarbonFootprint,
    SustainabilityAnswer SustainableSourcing,
    SustainabilityAnswer WaterConservation,
    SustainabilityAnswer EmployeeWellbeing,
    SustainabilityAnswer CommunityEngagement,
    SustainabilityAnswer EthicalGovernance,
    SustainabilityAnswer EnvironmentalCertification,
    DateTime UpdatedAt);

public sealed record UpsertSustainabilityProfileRequest(
    SustainabilityAnswer EnergyEfficiency,
    SustainabilityAnswer WasteReduction,
    SustainabilityAnswer CarbonFootprint,
    SustainabilityAnswer SustainableSourcing,
    SustainabilityAnswer WaterConservation,
    SustainabilityAnswer EmployeeWellbeing,
    SustainabilityAnswer CommunityEngagement,
    SustainabilityAnswer EthicalGovernance,
    SustainabilityAnswer EnvironmentalCertification);

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
