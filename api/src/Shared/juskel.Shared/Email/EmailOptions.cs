namespace juskel.Shared.Email;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public string Provider { get; init; } = "Console";

    public string DefaultFrom { get; init; } = "juskel <hello@juskel.co.uk>";

    /// <summary>Public base URL for hosted email images, e.g. https://cdn.juskel.com/email</summary>
    public string AssetsBaseUrl { get; init; } = string.Empty;

    public string WebsiteUrl { get; init; } = "https://www.juskel.com";

    public string SupportUrl { get; init; } = "mailto:support@juskel.com";

    public string TermsUrl { get; init; } = "https://www.juskel.com/terms";

    public string PrivacyUrl { get; init; } = "https://www.juskel.com/privacy";

    public string UnsubscribeUrl { get; init; } = "https://www.juskel.com/unsubscribe";
}