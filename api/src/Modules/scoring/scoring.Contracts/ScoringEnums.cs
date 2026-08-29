namespace scoring.Contracts;

// Dropdown enums: integer values are persisted in SQL. Never reuse or renumber a value
// after release — add new members with the next free integer and mirror the same
// value in api/onboarding-lookups.json.

public enum SustainabilityAnswer
{
    NotAnswered = 0,
    Yes = 1,
    No = 2,
    InProgress = 3,
    Partially = 4,
    Occasionally = 5,
}

public enum SustainabilityQuestionKey
{
    GhgEmissions = 1,
    SustainabilityPolicy = 2,
    ResourceTracking = 3,
    Wellbeing = 4,
    Training = 5,
    Dei = 6,
    Continuity = 7,
    GovernancePolicies = 8,
    RiskReview = 9,
}
