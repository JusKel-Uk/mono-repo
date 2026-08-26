namespace onboarding.Contracts;

public enum OnboardingStep
{
    Company = 1,
    Business = 2,
    Financial = 3,
    Sustainability = 4,
    Funding = 5,
}

public enum StepStatus
{
    NotStarted = 0,
    InProgress = 1,
    Complete = 2,
}

public enum SubmissionStatus
{
    Draft = 0,
    Submitted = 1,
}