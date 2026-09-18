using System.Security.Cryptography;
using System.Text;
using lender.Core.Entities;
using lender.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace lender.Core.Services;

internal interface ILenderInviteTokenService
{
    (string PlainToken, string TokenHash) IssueToken();

    string HashToken(string plainToken);
}

internal sealed class LenderInviteTokenService : ILenderInviteTokenService
{
    public (string PlainToken, string TokenHash) IssueToken()
    {
        var plainToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        return (plainToken, HashToken(plainToken));
    }

    public string HashToken(string plainToken)
    {
        var normalized = plainToken.Trim();
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(hash);
    }
}

internal static class LenderInviteQueries
{
    public static async Task<LenderInvite?> FindPendingByTokenAsync(
        LenderDbContext db,
        ILenderInviteTokenService tokens,
        string rawToken,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
            return null;

        var tokenHash = tokens.HashToken(rawToken);
        var invite = await db.LenderInvites
            .Include(i => i.AccessRequest)
            .Include(i => i.LenderOrganisation)
            .FirstOrDefaultAsync(
                i => i.TokenHash == tokenHash && i.ConsumedAt == null,
                ct);

        if (invite is null || invite.ExpiresAt < DateTime.UtcNow)
            return null;

        return invite;
    }
}
