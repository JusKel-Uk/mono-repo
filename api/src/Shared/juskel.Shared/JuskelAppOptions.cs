namespace juskel.Shared;

/// <summary>
/// Top-level juskel app settings. Bound from <see cref="FrontendUrlKey"/> in appsettings or env.
/// </summary>
public sealed class JuskelAppOptions
{
    public const string FrontendUrlKey = "JUSKEL_FRONTEND_URL";

    /// <summary>Next.js / client base URL (no trailing slash), e.g. http://localhost:3000</summary>
    public string FrontendUrl { get; set; } = string.Empty;
}
