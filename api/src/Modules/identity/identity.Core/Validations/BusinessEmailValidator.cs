namespace identity.Core.Validation;

internal static class BusinessEmailValidator
{
    private static readonly HashSet<string> BlockedDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "gmail.com",
        "googlemail.com",
        "yahoo.com",
        "yahoo.co.uk",
        "hotmail.com",
        "hotmail.co.uk",
        "outlook.com",
        "live.com",
        "msn.com",
        "icloud.com",
        "me.com",
        "mac.com",
        "aol.com",
        "protonmail.com",
        "proton.me",
        "mail.com",
        "gmx.com",
        "yandex.com",
        "mail.ru",
        "zoho.com",      // remove if you accept Zoho business mail
        "fastmail.com",
        "tutanota.com",
        "hey.com"
    };

    public static bool TryGetDomain(string email, out string domain)
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

    public static bool IsBusinessEmail(string email) =>
        TryGetDomain(email, out var domain) && !BlockedDomains.Contains(domain);

    public static bool MatchesOrganisationDomain(string email, string organisationDomain)
    {
        if (!TryGetDomain(email, out var inviteDomain))
            return false;

        return string.Equals(
            inviteDomain,
            organisationDomain.Trim().ToLowerInvariant(),
            StringComparison.Ordinal);
    }
}