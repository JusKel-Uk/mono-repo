namespace identity.Contracts;

public sealed record NotificationPreferencesDto(
    bool AssessmentProgress,
    bool SubmissionsNeedAttention,
    bool ExpertReviewUpdates,
    bool IntegrationSyncEvents,
    bool ScoreUpdates,
    bool NewFundingMatches)
{
    public static NotificationPreferencesDto AllEnabled { get; } = new(
        true, true, true, true, true, true);
}
