using scoring.Contracts;

namespace scoring.Core.Entities;

internal sealed class SustainabilityProfile
{
    public Guid ApplicationId { get; set; }

    public SustainabilityAnswer EnergyEfficiency { get; set; }

    public SustainabilityAnswer WasteReduction { get; set; }

    public SustainabilityAnswer CarbonFootprint { get; set; }

    public SustainabilityAnswer SustainableSourcing { get; set; }

    public SustainabilityAnswer WaterConservation { get; set; }

    public SustainabilityAnswer EmployeeWellbeing { get; set; }

    public SustainabilityAnswer CommunityEngagement { get; set; }

    public SustainabilityAnswer EthicalGovernance { get; set; }

    public SustainabilityAnswer EnvironmentalCertification { get; set; }

    public DateTime UpdatedAt { get; set; }
}
