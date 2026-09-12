namespace identity.Core.Entities;

internal sealed class NotificationPreferences
{
    public Guid UserId { get; set; }

    public bool AssessmentProgress { get; set; } = true;

    public bool SubmissionsNeedAttention { get; set; } = true;

    public bool ExpertReviewUpdates { get; set; } = true;

    public bool IntegrationSyncEvents { get; set; } = true;

    public bool ScoreUpdates { get; set; } = true;

    public bool NewFundingMatches { get; set; } = true;

    public bool InAppEnabled { get; set; } = true;

    public bool EmailEnabled { get; set; } = true;
}
