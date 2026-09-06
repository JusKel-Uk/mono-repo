using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.PutNotificationPreferences;

internal sealed class PutNotificationPreferencesHandler
{
    private readonly IdentityDbContext _db;

    public PutNotificationPreferencesHandler(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<NotificationPreferencesDto?> HandleAsync(
        PutNotificationPreferencesCommand command,
        CancellationToken ct = default)
    {
        var userExists = await _db.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == command.UserId && u.DeletedAt == null, ct);

        if (!userExists)
            return null;

        var row = await _db.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == command.UserId, ct);

        var prefs = command.Preferences;

        if (row is null)
        {
            row = new NotificationPreferences { UserId = command.UserId };
            _db.NotificationPreferences.Add(row);
        }

        row.AssessmentProgress = prefs.AssessmentProgress;
        row.SubmissionsNeedAttention = prefs.SubmissionsNeedAttention;
        row.ExpertReviewUpdates = prefs.ExpertReviewUpdates;
        row.IntegrationSyncEvents = prefs.IntegrationSyncEvents;
        row.ScoreUpdates = prefs.ScoreUpdates;
        row.NewFundingMatches = prefs.NewFundingMatches;

        await _db.SaveChangesAsync(ct);
        return prefs;
    }
}
