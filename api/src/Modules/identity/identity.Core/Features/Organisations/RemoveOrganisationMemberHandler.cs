using identity.Contracts;
using identity.Core.Persistence;
using identity.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.Organisations;

internal sealed class RemoveOrganisationMemberHandler
{
    private readonly IdentityDbContext _db;

    public RemoveOrganisationMemberHandler(IdentityDbContext db) => _db = db;

    public async Task<bool?> HandleAsync(
        Guid actorUserId,
        Guid organisationId,
        Guid targetUserId,
        CancellationToken ct = default)
    {
        var actorMembership = await _db.OrganisationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.UserId == actorUserId && m.OrganisationId == organisationId,
                ct);

        if (actorMembership is null || !OrganisationPermissions.CanManageTeam(actorMembership.Role))
            return null;

        var targetMembership = await _db.OrganisationMembers
            .FirstOrDefaultAsync(
                m => m.UserId == targetUserId && m.OrganisationId == organisationId,
                ct);

        if (targetMembership is null)
            return false;

        var ownerCount = await OrganisationMemberGuards.CountOwnersAsync(_db, organisationId, ct);
        if (OrganisationMemberGuards.IsLastOwner(targetMembership.Role, ownerCount))
            throw new InvalidOperationException("Cannot remove the last owner.");

        _db.OrganisationMembers.Remove(targetMembership);

        var usersWithLastOrg = await _db.Users
            .Where(u => u.Id == targetUserId && u.LastOrganisationId == organisationId)
            .ToListAsync(ct);

        foreach (var user in usersWithLastOrg)
            user.LastOrganisationId = null;

        await _db.SaveChangesAsync(ct);
        return true;
    }
}
