using Microsoft.AspNetCore.Http;

namespace identity.Core.Http;

internal static class PortalHttpHeaders
{
    public const string Portal = "X-Juskel-Portal";

    public static string? TryGetPortal(HttpRequest request) =>
        request.Headers.TryGetValue(Portal, out var values)
            ? values.ToString()
            : null;
}
