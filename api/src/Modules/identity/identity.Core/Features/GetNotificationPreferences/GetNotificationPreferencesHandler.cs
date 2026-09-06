using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.GetNotificationPreferences;

internal sealed class GetNotificationPreferencesHandler
{
    private readonly IdentityDbContext _db;

    public GetNotificationPreferencesHandler(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<NotificationPreferencesDto> HandleAsync(
        GetNotificationPreferencesQuery query,
        CancellationToken ct = default)
    {
        var row = await _db.NotificationPreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == query.UserId, ct);

        return row is null
            ? NotificationPreferencesDto.AllEnabled
            : new NotificationPreferencesDto(
                row.AssessmentProgress,
                row.SubmissionsNeedAttention,
                row.ExpertReviewUpdates,
                row.IntegrationSyncEvents,
                row.ScoreUpdates,
                row.NewFundingMatches);
    }
}
