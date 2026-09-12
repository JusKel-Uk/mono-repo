namespace identity.Contracts;

public sealed record NotificationPreferencesDto(
    bool AssessmentProgress,
    bool SubmissionsNeedAttention,
    bool ExpertReviewUpdates,
    bool IntegrationSyncEvents,
    bool ScoreUpdates,
    bool NewFundingMatches,
    bool InAppEnabled = true,
    bool EmailEnabled = true)
{
    public static NotificationPreferencesDto AllEnabled { get; } = new(
        true, true, true, true, true, true, true, true);
}
