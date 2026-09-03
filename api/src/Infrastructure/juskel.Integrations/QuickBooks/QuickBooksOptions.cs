namespace juskel.Integrations.QuickBooks;

public sealed class QuickBooksOptions
{
    public const string SectionName = "Integrations:QuickBooks";

    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string RedirectUri { get; set; } = "http://localhost:5242/funding/integrations/quickbooks/callback";

    public string AuthBaseUrl { get; set; } = "https://appcenter.intuit.com/connect/oauth2";

    public string TokenUrl { get; set; } = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

    public string ApiBaseUrl { get; set; } = "https://sandbox-quickbooks.api.intuit.com/v3/company";

    public string MinorVersion { get; set; } = "65";

    public string ReportStartDate { get; set; } = "2024-01-01";

    public string ReportEndDate { get; set; } = "2024-12-31";
}
