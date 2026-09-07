using identity.Contracts;
using identity.Core.Persistence;
using identity.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.Organisations;

internal sealed class UpdateOrganisationMemberHandler
{
    private readonly IdentityDbContext _db;

    public UpdateOrganisationMemberHandler(IdentityDbContext db) => _db = db;

    public async Task<OrganisationMemberDto?> HandleAsync(
        Guid actorUserId,
        Guid organisationId,
        Guid targetUserId,
        UpdateOrganisationMemberRequest request,
        CancellationToken ct = default)
    {
        if (!Enum.IsDefined(request.Role))
            throw new ArgumentException("Invalid role.");

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
            return null;

        var ownerCount = await OrganisationMemberGuards.CountOwnersAsync(_db, organisationId, ct);

        if (OrganisationMemberGuards.IsLastOwner(targetMembership.Role, ownerCount) &&
            request.Role != OrganisationRole.Owner)
        {
            throw new InvalidOperationException("Cannot change role of the last owner.");
        }

        if (request.Role != OrganisationRole.Owner &&
            targetMembership.Role == OrganisationRole.Owner &&
            ownerCount <= 1)
        {
            throw new InvalidOperationException("Organisation must have at least one owner.");
        }

        targetMembership.Role = request.Role;
        await _db.SaveChangesAsync(ct);

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == targetUserId && u.DeletedAt == null, ct);

        if (user is null)
            return null;

        return new OrganisationMemberDto(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            targetMembership.Role,
            targetMembership.JoinedAt);
    }
}
