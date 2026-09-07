using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.Organisations;

internal sealed class SetCurrentOrganisationHandler
{
    private readonly IdentityDbContext _db;

    public SetCurrentOrganisationHandler(IdentityDbContext db) => _db = db;

    public async Task<OrganisationSummaryDto?> HandleAsync(
        Guid userId,
        Guid organisationId,
        CancellationToken ct = default)
    {
        var membership = await _db.OrganisationMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.OrganisationId == organisationId)
            .Join(
                _db.Organisations.AsNoTracking(),
                m => m.OrganisationId,
                o => o.Id,
                (m, o) => new { m.Role, Organisation = o })
            .FirstOrDefaultAsync(ct);

        if (membership is null)
            return null;

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null, ct);

        if (user is null)
            return null;

        user.LastOrganisationId = organisationId;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new OrganisationSummaryDto(
            membership.Organisation.Id,
            membership.Organisation.Name,
            membership.Role,
            membership.Organisation.ClosureRequestedAt is not null,
            true);
    }
}
