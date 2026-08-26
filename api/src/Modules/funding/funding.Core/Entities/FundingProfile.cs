using funding.Contracts;

namespace funding.Core.Entities;

internal sealed class FundingProfile
{
    public Guid ApplicationId { get; set; }

    public decimal RequestedAmount { get; set; }

    public FundingPurpose Purpose { get; set; }

    public int TermMonths { get; set; }

    public FundingUrgency Urgency { get; set; }

    public DateTime UpdatedAt { get; set; }
}
