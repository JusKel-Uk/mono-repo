namespace juskel.Integrations.Xero;

public sealed class XeroOptions
{
    public const string SectionName = "Integrations:Xero";

    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string RedirectUri { get; set; } = "http://localhost:5000/funding/integrations/xero/callback";

    public string AuthBaseUrl { get; set; } = "https://login.xero.com/identity/connect/authorize";

    public string TokenUrl { get; set; } = "https://identity.xero.com/connect/token";
}
