using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.Organisations;

internal sealed class ListOrganisationInvitesHandler
{
    private readonly IdentityDbContext _db;

    public ListOrganisationInvitesHandler(IdentityDbContext db) => _db = db;

    public async Task<IReadOnlyList<OrganisationInviteDto>?> HandleAsync(
        Guid userId,
        Guid organisationId,
        CancellationToken ct = default)
    {
        var membership = await _db.OrganisationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.UserId == userId && m.OrganisationId == organisationId,
                ct);

        if (membership is null || !OrganisationPermissions.CanManageTeam(membership.Role))
            return null;

        var invites = await _db.OrganisationInvites
            .AsNoTracking()
            .Where(i => i.OrganisationId == organisationId && i.AcceptedAt == null)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(ct);

        return invites
            .Select(i => new OrganisationInviteDto(
                i.Id,
                i.Email ?? string.Empty,
                i.Role,
                i.ExpiresAt,
                i.CreatedAt))
            .ToList();
    }
}
