using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using identity.Contracts;

namespace lender.Core.Http;

internal static class LenderHttpUser
{
    public static bool TryGetUserId(ClaimsPrincipal user, out Guid userId)
    {
        var raw = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(raw, out userId);
    }

    public static bool HasLenderPortal(ClaimsPrincipal user) =>
        string.Equals(
            user.FindFirstValue(JwtClaimNames.Portal),
            PortalNames.Lender,
            StringComparison.OrdinalIgnoreCase);
}
