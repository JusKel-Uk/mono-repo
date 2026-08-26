using scoring.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace scoring.Core.Examples;

public sealed class SustainabilityProfileResponseExample : IExamplesProvider<SustainabilityProfileResponse>
{
    public SustainabilityProfileResponse GetExamples() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        SustainabilityAnswer.Yes,
        SustainabilityAnswer.Partially,
        SustainabilityAnswer.Yes,
        SustainabilityAnswer.Yes,
        SustainabilityAnswer.No,
        SustainabilityAnswer.Yes,
        SustainabilityAnswer.Partially,
        SustainabilityAnswer.Yes,
        SustainabilityAnswer.NotApplicable,
        DateTime.UtcNow);
}

public sealed class UpsertSustainabilityProfileRequestExample : IExamplesProvider<UpsertSustainabilityProfileRequest>
{
    public UpsertSustainabilityProfileRequest GetExamples() => new(
        SustainabilityAnswer.Yes,
        SustainabilityAnswer.Partially,
        SustainabilityAnswer.Yes,
        SustainabilityAnswer.Yes,
        SustainabilityAnswer.No,
        SustainabilityAnswer.Yes,
        SustainabilityAnswer.Partially,
        SustainabilityAnswer.Yes,
        SustainabilityAnswer.NotApplicable);
}

public sealed class SustainabilityEvidenceResponseExample : IExamplesProvider<SustainabilityEvidenceResponse>
{
    public SustainabilityEvidenceResponse GetExamples() => new(
        Guid.Parse("33333333-3333-3333-3333-333333333333"),
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        SustainabilityQuestionKey.EnvironmentalCertification,
        "iso14001-certificate.pdf",
        "application/pdf",
        256_000,
        DateTime.UtcNow);
}
