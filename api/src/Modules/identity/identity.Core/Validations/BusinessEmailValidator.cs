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

    public static bool IsBusinessEmail(string email)
    {
        var at = email.LastIndexOf('@');
        if (at <= 0 || at == email.Length - 1)
            return false;

        var domain = email[(at + 1)..];
        return !BlockedDomains.Contains(domain);
    }
}