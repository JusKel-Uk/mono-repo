using onboarding.Contracts;

namespace onboarding.Core.Entities;

internal sealed class BusinessProfile
{
    public Guid ApplicationId { get; set; }

    public BusinessSector Sector { get; set; }

    public string? SubSector { get; set; }

    public UkRegion Region { get; set; }

    public EmployeeSizeBand EmployeeSizeBand { get; set; }

    public AnnualTurnoverBand AnnualTurnoverBand { get; set; }

    public YearsInOperationBand YearsInOperationBand { get; set; }

    public string City { get; set; } = string.Empty;

    public string Postcode { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; }

    public Application Application { get; set; } = null!;
}
