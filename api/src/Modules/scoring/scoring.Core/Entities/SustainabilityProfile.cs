using scoring.Contracts;

namespace scoring.Core.Entities;

internal sealed class SustainabilityProfile
{
    public Guid ApplicationId { get; set; }

    public SustainabilityAnswer GhgEmissions { get; set; }

    public SustainabilityAnswer SustainabilityPolicy { get; set; }

    public SustainabilityAnswer ResourceTracking { get; set; }

    public SustainabilityAnswer Wellbeing { get; set; }

    public SustainabilityAnswer Training { get; set; }

    public SustainabilityAnswer Dei { get; set; }

    public SustainabilityAnswer Continuity { get; set; }

    public SustainabilityAnswer GovernancePolicies { get; set; }

    public SustainabilityAnswer RiskReview { get; set; }

    public DateTime UpdatedAt { get; set; }
}
