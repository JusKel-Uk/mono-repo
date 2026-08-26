using onboarding.Contracts;

namespace onboarding.Core.Entities;

internal sealed class CompanySetup
{
    public Guid ApplicationId { get; set; }

    public string LegalName { get; set; } = string.Empty;

    public string? TradingName { get; set; }

    public string? CompaniesHouseNumber { get; set; }

    public bool IsCompaniesHouseVerified { get; set; }

    public CompanyRelationship Relationship { get; set; }

    public UkRegion Region { get; set; }

    public string RegisteredAddressLine1 { get; set; } = string.Empty;

    public string? RegisteredAddressLine2 { get; set; }

    public string City { get; set; } = string.Empty;

    public string Postcode { get; set; } = string.Empty;

    public EmployeeSizeBand EmployeeSizeBand { get; set; }

    public AnnualTurnoverBand AnnualTurnoverBand { get; set; }

    public YearsInOperationBand YearsInOperationBand { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Application Application { get; set; } = null!;
}
