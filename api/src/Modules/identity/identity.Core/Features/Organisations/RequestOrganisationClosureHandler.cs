using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.Organisations;

internal sealed class RequestOrganisationClosureHandler
{
    public const string RequestedStatus = "requested";

    private readonly IdentityDbContext _db;

    public RequestOrganisationClosureHandler(IdentityDbContext db) => _db = db;

    public async Task<OrganisationClosureResponse?> HandleAsync(
        Guid userId,
        Guid organisationId,
        CancellationToken ct = default)
    {
        var membership = await _db.OrganisationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.UserId == userId && m.OrganisationId == organisationId,
                ct);

        if (membership is null || !OrganisationPermissions.CanCloseOrganisation(membership.Role))
            return null;

        var organisation = await _db.Organisations
            .FirstOrDefaultAsync(o => o.Id == organisationId, ct);

        if (organisation is null)
            return null;

        if (organisation.ClosureRequestedAt is null)
        {
            organisation.ClosureRequestedAt = DateTime.UtcNow;
            organisation.UpdatedAt = organisation.ClosureRequestedAt.Value;
            await _db.SaveChangesAsync(ct);
        }

        return new OrganisationClosureResponse(
            RequestedStatus,
            DateTime.SpecifyKind(organisation.ClosureRequestedAt.Value, DateTimeKind.Utc));
    }
}
