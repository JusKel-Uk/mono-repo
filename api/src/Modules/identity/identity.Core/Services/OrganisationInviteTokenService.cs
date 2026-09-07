using System.Security.Cryptography;
using System.Text;
using identity.Core.Entities;

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
        var bytes = RandomNumberGenerator.GetBytes(32);
        var plainToken = Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        return (plainToken, HashToken(plainToken));
    }

    public string HashToken(string plainToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(plainToken));
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
