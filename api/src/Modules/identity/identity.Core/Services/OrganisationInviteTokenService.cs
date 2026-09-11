using System.Security.Cryptography;
using System.Text;
using identity.Core.Entities;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Services;

internal interface IOrganisationInviteTokenService
{
    (string PlainToken, string TokenHash) IssueToken();

    string HashToken(string plainToken);

    string Rotate(OrganisationInvite invite);
}

internal sealed class OrganisationInviteTokenService : IOrganisationInviteTokenService
{
    public (string PlainToken, string TokenHash) IssueToken()
    {
        var plainToken = OtpCodes.Generate();
        return (plainToken, HashToken(plainToken));
    }

    public string HashToken(string plainToken)
    {
        var normalized = OtpCodes.Normalize(plainToken);
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(hash);
    }

    public string Rotate(OrganisationInvite invite)
    {
        var (plainToken, tokenHash) = IssueToken();
        invite.TokenHash = tokenHash;
        invite.ExpiresAt = DateTime.UtcNow.AddDays(OrganisationInvite.ExpiryDays);
        return plainToken;
    }
}

internal static class OrganisationInviteTokenServiceExtensions
{
    public static async Task<string> RotateUniqueAsync(
        this IOrganisationInviteTokenService tokens,
        IdentityDbContext db,
        OrganisationInvite invite,
        CancellationToken ct)
    {
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var plainToken = tokens.Rotate(invite);
            var taken = await db.OrganisationInvites
                .AsNoTracking()
                .AnyAsync(
                    row => row.TokenHash == invite.TokenHash && row.Id != invite.Id,
                    ct);

            if (!taken)
                return plainToken;
        }

        throw new InvalidOperationException("Could not allocate a unique invite code.");
    }
}
