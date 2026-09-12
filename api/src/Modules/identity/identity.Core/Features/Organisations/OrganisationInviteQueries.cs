using identity.Core.Entities;
using identity.Core.Persistence;
using identity.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.Organisations;

internal static class OrganisationInviteQueries
{
    public static async Task<OrganisationInvite?> FindPendingByCodeAsync(
        IdentityDbContext db,
        IOrganisationInviteTokenService tokens,
        string rawCode,
        CancellationToken ct)
    {
        var code = OtpCodes.Normalize(rawCode);
        if (code.Length != OtpCodes.Length)
            return null;

        var tokenHash = tokens.HashToken(code);
        var invite = await db.OrganisationInvites
            .Include(i => i.Organisation)
            .FirstOrDefaultAsync(
                i => i.TokenHash == tokenHash && i.AcceptedAt == null,
                ct);

        if (invite is null || invite.ExpiresAt < DateTime.UtcNow)
            return null;

        return invite;
    }
}
