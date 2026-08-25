using onboarding.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace onboarding.Core.Examples;

public sealed class CreateApplicationResponseExample : IExamplesProvider<CreateApplicationResponse>
{
    public CreateApplicationResponse GetExamples() =>
        new(Guid.Parse("11111111-1111-1111-1111-111111111111"));
}

public sealed class ApplicationResponseExample : IExamplesProvider<ApplicationResponse>
{
    public ApplicationResponse GetExamples() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        SubmissionStatus.Draft,
        0,
        5,
        false,
        Enum.GetValues<OnboardingStep>()
            .Select(step => new StepProgressDto(step, StepStatus.NotStarted, null))
            .ToList(),
        DateTime.UtcNow.AddDays(-1),
        DateTime.UtcNow,
        null);
}

public sealed class CompanySetupResponseExample : IExamplesProvider<CompanySetupResponse>
{
    public CompanySetupResponse GetExamples() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        "Acme Widgets Ltd",
        "Acme Widgets",
        "12345678",
        true,
        CompanyRelationship.Director,
        UkRegion.England,
        "1 High Street",
        null,
        "London",
        "EC1A 1BB",
        EmployeeSizeBand.Small10To49,
        AnnualTurnoverBand.From250KTo1M,
        YearsInOperationBand.From3To5Years,
        DateTime.UtcNow);
}

public sealed class UpsertCompanySetupRequestExample : IExamplesProvider<UpsertCompanySetupRequest>
{
    public UpsertCompanySetupRequest GetExamples() => new(
        "Acme Widgets Ltd",
        "Acme Widgets",
        "12345678",
        CompanyRelationship.Director,
        UkRegion.England,
        "1 High Street",
        null,
        "London",
        "EC1A 1BB",
        EmployeeSizeBand.Small10To49,
        AnnualTurnoverBand.From250KTo1M,
        YearsInOperationBand.From3To5Years);
}

public sealed class VerifyCompaniesHouseRequestExample : IExamplesProvider<VerifyCompaniesHouseRequest>
{
    public VerifyCompaniesHouseRequest GetExamples() => new("12345678");
}

public sealed class VerifyCompaniesHouseResponseExample : IExamplesProvider<VerifyCompaniesHouseResponse>
{
    public VerifyCompaniesHouseResponse GetExamples() => new(
        "12345678",
        "ACME WIDGETS LTD",
        "active",
        "1 High Street, London, EC1A 1BB",
        true,
        true);
}

public sealed class BusinessProfileResponseExample : IExamplesProvider<BusinessProfileResponse>
{
    public BusinessProfileResponse GetExamples() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        BusinessSector.Technology,
        UkRegion.England,
        EmployeeSizeBand.Small10To49,
        AnnualTurnoverBand.From250KTo1M,
        YearsInOperationBand.From3To5Years,
        "London",
        "EC1A 1BB",
        "We design sustainable packaging for SMEs.",
        DateTime.UtcNow);
}

public sealed class UpsertBusinessProfileRequestExample : IExamplesProvider<UpsertBusinessProfileRequest>
{
    public UpsertBusinessProfileRequest GetExamples() => new(
        BusinessSector.Technology,
        UkRegion.England,
        EmployeeSizeBand.Small10To49,
        AnnualTurnoverBand.From250KTo1M,
        YearsInOperationBand.From3To5Years,
        "London",
        "EC1A 1BB",
        "We design sustainable packaging for SMEs.");
}

public sealed class SubmitApplicationResponseExample : IExamplesProvider<SubmitApplicationResponse>
{
    public SubmitApplicationResponse GetExamples() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        SubmissionStatus.Submitted,
        DateTime.UtcNow);
}
