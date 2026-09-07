using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using identity.Core.Services;
using identity.Core.Validation;
using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.Organisations;

internal sealed class CreateOrganisationInviteHandler
{
    private readonly IdentityDbContext _db;
    private readonly IEmailLookupHasher _emailLookupHasher;
    private readonly IOrganisationInviteTokenService _tokenService;
    private readonly IOrganisationInviteNotifier _notifier;

    public CreateOrganisationInviteHandler(
        IdentityDbContext db,
        IEmailLookupHasher emailLookupHasher,
        IOrganisationInviteTokenService tokenService,
        IOrganisationInviteNotifier notifier)
    {
        _db = db;
        _emailLookupHasher = emailLookupHasher;
        _tokenService = tokenService;
        _notifier = notifier;
    }

    public async Task<CreateOrganisationInviteResponse?> HandleAsync(
        Guid userId,
        Guid organisationId,
        CreateOrganisationInviteRequest request,
        CancellationToken ct = default)
    {
        if (!BusinessEmailValidator.IsBusinessEmail(request.Email))
            throw new ArgumentException("A business email address is required.");

        if (!Enum.IsDefined(request.Role) || request.Role == OrganisationRole.Owner)
            throw new ArgumentException("Invalid invite role.");

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

        if (!BusinessEmailValidator.MatchesOrganisationDomain(request.Email, organisation.EmailDomain))
            throw new ArgumentException("Invite email domain must match the organisation domain.");

        var inviter = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null, ct);

        if (inviter is null)
            return null;

        var email = _emailLookupHasher.NormalizeEmail(request.Email);
        var emailLookupHash = _emailLookupHasher.ComputeHash(email);

        var existingUserId = await _db.Users
            .Where(u => u.EmailLookupHash == emailLookupHash && u.DeletedAt == null)
            .Select(u => u.Id)
            .FirstOrDefaultAsync(ct);

        if (existingUserId != Guid.Empty)
        {
            var alreadyMember = await _db.OrganisationMembers
                .AnyAsync(m => m.OrganisationId == organisationId && m.UserId == existingUserId, ct);

            if (alreadyMember)
                throw new ArgumentException("This user is already a member of the organisation.");
        }

        var now = DateTime.UtcNow;
        var invite = new OrganisationInvite
        {
            Id = Guid.NewGuid(),
            OrganisationId = organisationId,
            Email = email,
            EmailLookupHash = emailLookupHash,
            Role = request.Role,
            InvitedByUserId = userId,
            CreatedAt = now,
        };
        var plainToken = _tokenService.Rotate(invite);

        _db.OrganisationInvites.Add(invite);
        await _db.SaveChangesAsync(ct);

        E2eInviteBridge.LogInviteIfDevelopment(email, plainToken);
        await _notifier.SendInviteAsync(inviter, organisation, email, request.Role, plainToken, ct);

        return new CreateOrganisationInviteResponse(
            invite.Id,
            email,
            invite.Role,
            invite.ExpiresAt,
            plainToken);
    }
}
