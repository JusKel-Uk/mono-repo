namespace onboarding.Contracts;

public sealed record CompanySetupResponse(
    Guid ApplicationId,
    string LegalName,
    string? TradingName,
    string? CompaniesHouseNumber,
    bool IsCompaniesHouseVerified,
    CompanyRelationship Relationship,
    UkRegion Region,
    string RegisteredAddressLine1,
    string? RegisteredAddressLine2,
    string City,
    string Postcode,
    EmployeeSizeBand EmployeeSizeBand,
    AnnualTurnoverBand AnnualTurnoverBand,
    YearsInOperationBand YearsInOperationBand,
    DateTime UpdatedAt);

public sealed record UpsertCompanySetupRequest(
    string LegalName,
    string? TradingName,
    string? CompaniesHouseNumber,
    CompanyRelationship Relationship,
    UkRegion Region,
    string RegisteredAddressLine1,
    string? RegisteredAddressLine2,
    string City,
    string Postcode,
    EmployeeSizeBand EmployeeSizeBand,
    AnnualTurnoverBand AnnualTurnoverBand,
    YearsInOperationBand YearsInOperationBand);

public sealed record VerifyCompaniesHouseRequest(string CompanyNumber);

public sealed record VerifyCompaniesHouseResponse(
    string CompanyNumber,
    string CompanyName,
    string Status,
    string? RegisteredOfficeAddress,
    bool IsActive,
    bool IsVerified);
