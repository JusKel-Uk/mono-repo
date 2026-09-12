namespace notifications.Contracts;

public enum NotificationCategory
{
    AssessmentProgress = 1,
    SubmissionsNeedAttention = 2,
    ExpertReviewUpdates = 3,
    IntegrationSyncEvents = 4,
    ScoreUpdates = 5,
    NewFundingMatches = 6,
}

public enum NotificationChannel
{
    InApp = 1,
    Email = 2,
}

public static class NotificationCategoryDisplay
{
    public static string ToInboxLabel(NotificationCategory category) => category switch
    {
        NotificationCategory.AssessmentProgress => "ONBOARDING",
        NotificationCategory.SubmissionsNeedAttention => "SUBMISSION",
        NotificationCategory.ExpertReviewUpdates => "EXPERT REVIEW",
        NotificationCategory.IntegrationSyncEvents => "INTEGRATION",
        NotificationCategory.ScoreUpdates => "SCORE",
        NotificationCategory.NewFundingMatches => "FUNDING MATCH",
        _ => category.ToString().ToUpperInvariant(),
    };
}
