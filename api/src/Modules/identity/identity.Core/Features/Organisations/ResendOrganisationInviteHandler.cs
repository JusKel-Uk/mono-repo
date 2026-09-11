using identity.Contracts;
using identity.Core.Persistence;
using identity.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.Organisations;

internal sealed class ResendOrganisationInviteHandler
{
    private readonly IdentityDbContext _db;
    private readonly IOrganisationInviteTokenService _tokenService;
    private readonly IOrganisationInviteNotifier _notifier;

    public ResendOrganisationInviteHandler(
        IdentityDbContext db,
        IOrganisationInviteTokenService tokenService,
        IOrganisationInviteNotifier notifier)
    {
        _db = db;
        _tokenService = tokenService;
        _notifier = notifier;
    }

    public async Task<CreateOrganisationInviteResponse?> HandleAsync(
        Guid userId,
        Guid organisationId,
        Guid inviteId,
        CancellationToken ct = default)
    {
        var inviterMembership = await _db.OrganisationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.UserId == userId && m.OrganisationId == organisationId,
                ct);

        if (inviterMembership is null || !OrganisationPermissions.CanManageTeam(inviterMembership.Role))
            return null;

        var organisation = await _db.Organisations
            .FirstOrDefaultAsync(o => o.Id == organisationId && o.ClosureRequestedAt == null, ct);

        if (organisation is null)
            return null;

        var inviter = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null, ct);

        if (inviter is null)
            return null;

        var invite = await _db.OrganisationInvites
            .FirstOrDefaultAsync(
                i => i.Id == inviteId
                     && i.OrganisationId == organisationId
                     && i.AcceptedAt == null,
                ct);

        if (invite is null || string.IsNullOrWhiteSpace(invite.Email))
            return null;

        var email = invite.Email!;
        var plainToken = await _tokenService.RotateUniqueAsync(_db, invite, ct);
        await _db.SaveChangesAsync(ct);

        E2eInviteBridge.LogInviteIfDevelopment(email, plainToken);
        await _notifier.SendInviteAsync(
            inviter,
            organisation,
            email,
            invite.Role,
            plainToken,
            ct);

        return new CreateOrganisationInviteResponse(
            invite.Id,
            email,
            invite.Role,
            invite.ExpiresAt,
            plainToken);
    }
}
