using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using identity.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.Organisations;

internal sealed class AcceptOrganisationInviteHandler
{
    private readonly IdentityDbContext _db;
    private readonly IOrganisationInviteTokenService _tokenService;

    public AcceptOrganisationInviteHandler(
        IdentityDbContext db,
        IOrganisationInviteTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<AcceptOrganisationInviteResponse?> HandleAsync(
        Guid userId,
        string token,
        CancellationToken ct = default)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null, ct);

        if (user is null)
            return null;

        var invite = await OrganisationInviteQueries.FindPendingByCodeAsync(
            _db,
            _tokenService,
            token,
            ct);

        if (invite is null)
            return null;

        if (!string.Equals(user.EmailLookupHash, invite.EmailLookupHash, StringComparison.Ordinal))
            return null;

        var alreadyMember = await _db.OrganisationMembers
            .AnyAsync(m => m.UserId == userId && m.OrganisationId == invite.OrganisationId, ct);

        if (!alreadyMember)
        {
            _db.OrganisationMembers.Add(new OrganisationMember
            {
                OrganisationId = invite.OrganisationId,
                UserId = userId,
                Role = invite.Role,
                JoinedAt = DateTime.UtcNow,
            });
        }

        invite.AcceptedAt = DateTime.UtcNow;
        if (user.LastOrganisationId is null)
            user.LastOrganisationId = invite.OrganisationId;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new AcceptOrganisationInviteResponse(
            invite.OrganisationId,
            invite.Organisation.Name,
            invite.Role);
    }
}
