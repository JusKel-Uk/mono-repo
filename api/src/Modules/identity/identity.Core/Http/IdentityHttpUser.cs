using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace identity.Core.Http;

internal static class IdentityHttpUser
{
    public static bool TryGetUserId(ClaimsPrincipal user, out Guid userId)
    {
        userId = default;
        var value = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(value, out userId);
    }

    public static bool TryGetJti(ClaimsPrincipal user, out string jti)
    {
        jti = user.FindFirstValue(JwtRegisteredClaimNames.Jti) ?? string.Empty;
        return !string.IsNullOrWhiteSpace(jti);
    }
}
