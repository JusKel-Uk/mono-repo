using identity.Contracts;
using notifications.Contracts;

namespace notifications.Core.Gateway;

internal static class PreferenceFilter
{
    public static IReadOnlyList<NotificationChannel> Apply(
        NotificationPreferencesDto prefs,
        NotificationCategory category,
        IReadOnlyList<NotificationChannel> requested)
    {
        if (!IsCategoryEnabled(prefs, category))
            return [];

        return requested
            .Where(channel => channel switch
            {
                NotificationChannel.InApp => prefs.InAppEnabled,
                NotificationChannel.Email => prefs.EmailEnabled,
                _ => false,
            })
            .Distinct()
            .ToArray();
    }

    public static bool IsCategoryEnabled(
        NotificationPreferencesDto prefs,
        NotificationCategory category) => category switch
    {
        NotificationCategory.AssessmentProgress => prefs.AssessmentProgress,
        NotificationCategory.SubmissionsNeedAttention => prefs.SubmissionsNeedAttention,
        NotificationCategory.ExpertReviewUpdates => prefs.ExpertReviewUpdates,
        NotificationCategory.IntegrationSyncEvents => prefs.IntegrationSyncEvents,
        NotificationCategory.ScoreUpdates => prefs.ScoreUpdates,
        NotificationCategory.NewFundingMatches => prefs.NewFundingMatches,
        _ => false,
    };
}
