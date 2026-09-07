using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Services;

internal sealed class OrganisationContextResolver : IOrganisationContextResolver
{
    private readonly IdentityDbContext _db;

    public OrganisationContextResolver(IdentityDbContext db)
    {
        _db = db;
    }

    public Task<OrganisationResolutionResult> ResolveAsync(
        Guid userId,
        Guid? requestedOrganisationId,
        CancellationToken ct = default) =>
        ResolveOrganisationAccessInternalAsync(userId, requestedOrganisationId, ct);

    internal static async Task<OrganisationResolutionResult> ResolveOrganisationAccessInternalAsync(
        IdentityDbContext db,
        Guid userId,
        Guid? requestedOrganisationId,
        CancellationToken ct)
    {
        var memberships = await db.OrganisationMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId)
            .Select(m => new { m.OrganisationId, m.Role })
            .ToListAsync(ct);

        if (memberships.Count == 0)
            return new OrganisationResolutionResult(OrganisationResolutionStatus.Forbidden);

        var lastOrganisationId = await db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId && u.DeletedAt == null)
            .Select(u => u.LastOrganisationId)
            .FirstOrDefaultAsync(ct);

        Guid? resolvedOrganisationId = requestedOrganisationId;

        if (resolvedOrganisationId is null)
        {
            if (lastOrganisationId is not null &&
                memberships.Any(m => m.OrganisationId == lastOrganisationId))
            {
                resolvedOrganisationId = lastOrganisationId;
            }
            else if (memberships.Count == 1)
            {
                resolvedOrganisationId = memberships[0].OrganisationId;
            }
            else
            {
                return new OrganisationResolutionResult(OrganisationResolutionStatus.ContextRequired);
            }
        }

        var membership = memberships.FirstOrDefault(m => m.OrganisationId == resolvedOrganisationId);
        if (membership is null)
            return new OrganisationResolutionResult(OrganisationResolutionStatus.Forbidden);

        var organisation = await db.Organisations
            .AsNoTracking()
            .Where(o => o.Id == resolvedOrganisationId)
            .Select(o => new { o.Name, o.ClosureRequestedAt })
            .FirstOrDefaultAsync(ct);

        if (organisation is null)
            return new OrganisationResolutionResult(OrganisationResolutionStatus.Forbidden);

        if (organisation.ClosureRequestedAt is not null)
            return new OrganisationResolutionResult(OrganisationResolutionStatus.OrganisationClosed);

        return new OrganisationResolutionResult(
            OrganisationResolutionStatus.Success,
            OrganisationAccessDto.Create(
                resolvedOrganisationId.Value,
                organisation.Name,
                membership.Role,
                false));
    }

    private Task<OrganisationResolutionResult> ResolveOrganisationAccessInternalAsync(
        Guid userId,
        Guid? requestedOrganisationId,
        CancellationToken ct) =>
        ResolveOrganisationAccessInternalAsync(_db, userId, requestedOrganisationId, ct);
}
