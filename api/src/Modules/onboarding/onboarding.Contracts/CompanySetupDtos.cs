using System.Text.Json.Serialization;

namespace onboarding.Contracts;

public sealed record CompanySetupResponse(
    Guid ApplicationId,
    string LegalName,
    string? CompaniesHouseNumber,
    bool IsCompaniesHouseVerified,
    CompanyRelationship Relationship,
    UkRegion Region,
    string RegisteredAddress,
    string City,
    string Postcode,
    EmployeeSizeBand EmployeeSizeBand,
    AnnualTurnoverBand AnnualTurnoverBand,
    YearsInOperationBand YearsInOperationBand,
    DateTime UpdatedAt);

public sealed record UpsertCompanySetupRequest(
    string LegalName,
    string? CompaniesHouseNumber,
    CompanyRelationship Relationship,
    UkRegion Region,
    string RegisteredAddress,
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
