namespace identity.Core.Services;

internal static class DeviceLabelFormatter
{
    public static string FromUserAgent(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
            return "Unknown device";

        var browser =
            Contains(userAgent, "Edg/") ? "Edge" :
            Contains(userAgent, "Chrome/") ? "Chrome" :
            Contains(userAgent, "Firefox/") ? "Firefox" :
            Contains(userAgent, "Safari/") ? "Safari" :
            "Browser";

        var os =
            Contains(userAgent, "iPhone") ? "iOS" :
            Contains(userAgent, "iPad") ? "iPadOS" :
            Contains(userAgent, "Android") ? "Android" :
            Contains(userAgent, "Mac OS X") || Contains(userAgent, "Macintosh") ? "macOS" :
            Contains(userAgent, "Windows") ? "Windows" :
            Contains(userAgent, "Linux") ? "Linux" :
            "Unknown OS";

        return $"{browser} on {os}";
    }

    private static bool Contains(string haystack, string needle) =>
        haystack.Contains(needle, StringComparison.OrdinalIgnoreCase);
}
