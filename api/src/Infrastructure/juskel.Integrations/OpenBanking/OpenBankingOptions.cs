namespace juskel.Integrations.OpenBanking;

public sealed class OpenBankingOptions
{
    public const string SectionName = "Integrations:OpenBanking";

    public string Provider { get; set; } = "TrueLayer";

    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string RedirectUri { get; set; } = "http://localhost:5000/funding/integrations/open-banking/callback";

    public string AuthBaseUrl { get; set; } = "https://auth.truelayer-sandbox.com";

    public string ApiBaseUrl { get; set; } = "https://api.truelayer-sandbox.com";

    /// <summary>Sandbox: uk-cs-mock. Production: uk-ob-all uk-oauth-all.</summary>
    public string Providers { get; set; } = "uk-ob-all uk-oauth-all";

    /// <summary>Optional — preselect ASPSP (sandbox: uk-cs-mock).</summary>
    public string ProviderId { get; set; } = string.Empty;

    public int TransactionDays { get; set; } = 90;
}
