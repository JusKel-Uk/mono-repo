using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using identity.Core.Services;
using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.Organisations;

internal sealed class AcceptOrganisationInviteHandler
{
    private readonly IdentityDbContext _db;
    private readonly IEmailLookupHasher _emailLookupHasher;
    private readonly IOrganisationInviteTokenService _tokenService;

    public AcceptOrganisationInviteHandler(
        IdentityDbContext db,
        IEmailLookupHasher emailLookupHasher,
        IOrganisationInviteTokenService tokenService)
    {
        _db = db;
        _emailLookupHasher = emailLookupHasher;
        _tokenService = tokenService;
    }

    public async Task<AcceptOrganisationInviteResponse?> HandleAsync(
        Guid userId,
        string token,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Invite token is required.");

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null, ct);

        if (user is null)
            return null;

        var tokenHash = _tokenService.HashToken(token.Trim());
        var invite = await _db.OrganisationInvites
            .Include(i => i.Organisation)
            .FirstOrDefaultAsync(
                i => i.TokenHash == tokenHash && i.AcceptedAt == null,
                ct);

        if (invite is null || invite.ExpiresAt < DateTime.UtcNow)
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
