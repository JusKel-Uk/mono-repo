using identity.Contracts;
using juskel.Shared.Security;
using lender.Contracts;
using lender.Core.Entities;
using lender.Core.Persistence;
using lender.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace lender.Core.Features.CreateAccount;

internal sealed class CreateAccountHandler
{
    private readonly LenderDbContext _db;
    private readonly ILenderInviteTokenService _inviteTokens;
    private readonly IIdentityAuthService _identityAuth;
    private readonly IEmailLookupHasher _emailLookupHasher;

    public CreateAccountHandler(
        LenderDbContext db,
        ILenderInviteTokenService inviteTokens,
        IIdentityAuthService identityAuth,
        IEmailLookupHasher emailLookupHasher)
    {
        _db = db;
        _inviteTokens = inviteTokens;
        _identityAuth = identityAuth;
        _emailLookupHasher = emailLookupHasher;
    }

    public async Task<LenderCreateAccountResponse> HandleAsync(
        LenderCreateAccountRequest request,
        string? userAgent,
        string? ipAddress,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.InviteToken))
            throw new ArgumentException("Invite token is required.");

        LenderPasswordPolicy.Validate(request.Password);

        var invite = await LenderInviteQueries.FindPendingByTokenAsync(
            _db,
            _inviteTokens,
            request.InviteToken,
            ct) ?? throw new ArgumentException("This invite is invalid, expired, or already used.");

        var email = _emailLookupHasher.NormalizeEmail(request.Email);
        if (!string.Equals(email, invite.AccessRequest.WorkEmail, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Email must match the invitation.");

        var user = await _identityAuth.CreateVerifiedUserAsync(
            new CreateVerifiedUserCommand(
                request.FirstName,
                request.LastName,
                email,
                request.Password),
            ct);

        var now = DateTime.UtcNow;
        invite.ConsumedAt = now;

        _db.LenderMembers.Add(new LenderMember
        {
            LenderOrganisationId = invite.LenderOrganisationId,
            UserId = user.UserId,
            Role = LenderMemberRole.Owner,
            JoinedAt = now,
        });

        await _db.SaveChangesAsync(ct);

        var session = await _identityAuth.CreateSessionAsync(
            new CreateSessionCommand(
                user.UserId,
                user.Email,
                PortalNames.Lender,
                userAgent,
                ipAddress),
            ct);

        return new LenderCreateAccountResponse(user.UserId, session.AccessToken);
    }
}
