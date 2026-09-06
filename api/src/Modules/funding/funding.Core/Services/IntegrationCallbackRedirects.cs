namespace funding.Core.Services;

internal static class IntegrationCallbackRedirects
{
    public const string FinancialProfilePath = "/onboarding/financial-profile";

    public static string? FinancialProfile(string? frontendBaseUrl, string integration, string status)
    {
        if (string.IsNullOrWhiteSpace(frontendBaseUrl))
            return null;

        var baseUrl = frontendBaseUrl.TrimEnd('/');
        var query = $"integration={Uri.EscapeDataString(integration)}&status={Uri.EscapeDataString(status)}";
        return $"{baseUrl}{FinancialProfilePath}?{query}";
    }
}
