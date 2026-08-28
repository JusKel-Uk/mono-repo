namespace scoring.Contracts;

// Dropdown enums: integer values are persisted in SQL. Never reuse or renumber a value
// after release — add new members with the next free integer and mirror the same
// value in api/onboarding-lookups.json.

public enum SustainabilityAnswer
{
    NotAnswered = 0,
    Yes = 1,
    No = 2,
    Partially = 3,
    NotApplicable = 4,
}

public enum SustainabilityQuestionKey
{
    EnergyEfficiency = 1,
    WasteReduction = 2,
    CarbonFootprint = 3,
    SustainableSourcing = 4,
    WaterConservation = 5,
    EmployeeWellbeing = 6,
    CommunityEngagement = 7,
    EthicalGovernance = 8,
    EnvironmentalCertification = 9,
}
