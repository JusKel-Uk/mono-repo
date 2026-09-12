using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core;

internal sealed class IdentityModule : IIdentityModule
{
    private readonly IdentityDbContext _db;

    public IdentityModule(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<UserSummaryDto?> GetUserAsync(
        Guid id,
        CancellationToken ct = default)
    {
        if (id == Guid.Empty)
            return null;

        return await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == id && u.DeletedAt == null)
            .Select(u => new UserSummaryDto(u.Id, u.Email, u.FirstName, u.LastName))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<IReadOnlyList<OrganisationSummaryDto>> ListOrganisationsAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var lastOrganisationId = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId && u.DeletedAt == null)
            .Select(u => u.LastOrganisationId)
            .FirstOrDefaultAsync(ct);

        var memberships = await _db.OrganisationMembers
            .AsNoTracking()
            .Include(m => m.Organisation)
            .Where(m => m.UserId == userId)
            .OrderBy(m => m.Organisation.Name)
            .ToListAsync(ct);

        return memberships
            .Select(m => new OrganisationSummaryDto(
                m.OrganisationId,
                m.Organisation.Name,
                m.Role,
                m.Organisation.ClosureRequestedAt.HasValue,
                lastOrganisationId.HasValue && m.OrganisationId == lastOrganisationId.Value))
            .ToList();
    }

    public async Task<OrganisationAccessDto?> GetOrganisationAccessAsync(
        Guid userId,
        Guid organisationId,
        CancellationToken ct = default)
    {
        var result = await Services.OrganisationContextResolver.ResolveOrganisationAccessInternalAsync(
            _db,
            userId,
            organisationId,
            ct);

        return result.Status == OrganisationResolutionStatus.Success ? result.Access : null;
    }

    public Task<OrganisationResolutionResult> ResolveOrganisationAccessAsync(
        Guid userId,
        Guid? requestedOrganisationId,
        CancellationToken ct = default) =>
        Services.OrganisationContextResolver.ResolveOrganisationAccessInternalAsync(
            _db,
            userId,
            requestedOrganisationId,
            ct);

    public async Task<NotificationPreferencesDto> GetNotificationPreferencesAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var row = await _db.NotificationPreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        return MapPreferences(row);
    }

    public async Task<NotificationPreferencesDto?> PutNotificationPreferencesAsync(
        Guid userId,
        NotificationPreferencesDto preferences,
        CancellationToken ct = default)
    {
        var userExists = await _db.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == userId && u.DeletedAt == null, ct);

        if (!userExists)
            return null;

        var row = await _db.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        if (row is null)
        {
            row = new NotificationPreferences { UserId = userId };
            _db.NotificationPreferences.Add(row);
        }

        row.AssessmentProgress = preferences.AssessmentProgress;
        row.SubmissionsNeedAttention = preferences.SubmissionsNeedAttention;
        row.ExpertReviewUpdates = preferences.ExpertReviewUpdates;
        row.IntegrationSyncEvents = preferences.IntegrationSyncEvents;
        row.ScoreUpdates = preferences.ScoreUpdates;
        row.NewFundingMatches = preferences.NewFundingMatches;
        row.InAppEnabled = preferences.InAppEnabled;
        row.EmailEnabled = preferences.EmailEnabled;

        await _db.SaveChangesAsync(ct);
        return preferences;
    }

    private static NotificationPreferencesDto MapPreferences(NotificationPreferences? row) =>
        row is null
            ? NotificationPreferencesDto.AllEnabled
            : new NotificationPreferencesDto(
                row.AssessmentProgress,
                row.SubmissionsNeedAttention,
                row.ExpertReviewUpdates,
                row.IntegrationSyncEvents,
                row.ScoreUpdates,
                row.NewFundingMatches,
                row.InAppEnabled,
                row.EmailEnabled);
}
