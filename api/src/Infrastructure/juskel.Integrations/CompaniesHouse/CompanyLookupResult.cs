namespace juskel.Integrations.CompaniesHouse;

public sealed record CompanyLookupResult(
    string CompanyNumber,
    string CompanyName,
    string Status,
    string? RegisteredOfficeAddress,
    bool IsActive);
