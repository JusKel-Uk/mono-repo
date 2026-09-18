namespace lender.Core.Validation;

internal static class LenderBusinessEmailValidator
{
    private static readonly HashSet<string> BlockedDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com",
        "hotmail.co.uk", "outlook.com", "live.com", "msn.com", "icloud.com",
        "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me",
    };

    public static bool IsBusinessEmail(string email) =>
        TryGetDomain(email, out var domain) && !BlockedDomains.Contains(domain);

    private static bool TryGetDomain(string email, out string domain)
    {
        var at = email.LastIndexOf('@');
        if (at <= 0 || at == email.Length - 1)
        {
            domain = string.Empty;
            return false;
        }

        domain = email[(at + 1)..].ToLowerInvariant();
        return true;
    }
}
