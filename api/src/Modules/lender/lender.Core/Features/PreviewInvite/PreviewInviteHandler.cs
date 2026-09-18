using lender.Contracts;
using lender.Core.Persistence;
using lender.Core.Services;

namespace lender.Core.Features.PreviewInvite;

internal sealed class PreviewInviteHandler
{
    private readonly LenderDbContext _db;
    private readonly ILenderInviteTokenService _inviteTokens;

    public PreviewInviteHandler(LenderDbContext db, ILenderInviteTokenService inviteTokens)
    {
        _db = db;
        _inviteTokens = inviteTokens;
    }

    public async Task<LenderInvitePreviewResponse?> HandleAsync(
        string token,
        CancellationToken ct = default)
    {
        var invite = await LenderInviteQueries.FindPendingByTokenAsync(_db, _inviteTokens, token, ct);
        if (invite is null)
            return null;

        return new LenderInvitePreviewResponse(
            invite.AccessRequest.WorkEmail,
            invite.AccessRequest.FirstName,
            invite.AccessRequest.LastName,
            invite.LenderOrganisation.Name);
    }
}
