namespace onboarding.Contracts;

public sealed record BusinessProfileResponse(
    Guid ApplicationId,
    BusinessSector Sector,
    UkRegion Region,
    EmployeeSizeBand EmployeeSizeBand,
    AnnualTurnoverBand AnnualTurnoverBand,
    YearsInOperationBand YearsInOperationBand,
    string City,
    string Postcode,
    string Description,
    DateTime UpdatedAt);

public sealed record UpsertBusinessProfileRequest(
    BusinessSector Sector,
    UkRegion Region,
    EmployeeSizeBand EmployeeSizeBand,
    AnnualTurnoverBand AnnualTurnoverBand,
    YearsInOperationBand YearsInOperationBand,
    string City,
    string Postcode,
    string Description);
