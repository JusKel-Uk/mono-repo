using identity.Contracts;
using Microsoft.AspNetCore.Http;

namespace identity.Core.Services;

internal sealed class PortalMembershipGuard
{
    private readonly IEnumerable<IPortalMembershipChecker> _checkers;

    public PortalMembershipGuard(IEnumerable<IPortalMembershipChecker> checkers)
    {
        _checkers = checkers;
    }

    public async Task EnsurePortalMembershipAsync(
        string? portal,
        string email,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(portal))
            return;

        var checker = _checkers.FirstOrDefault(c =>
            string.Equals(c.Portal, portal, StringComparison.OrdinalIgnoreCase));

        if (checker is null)
            return;

        if (!await checker.IsMemberByEmailAsync(email, ct))
        {
            throw new ArgumentException(
                $"No {portal} portal account exists for this email.");
        }
    }
}
