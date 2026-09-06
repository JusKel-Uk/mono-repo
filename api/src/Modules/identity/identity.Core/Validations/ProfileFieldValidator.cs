namespace identity.Core.Validation;

internal static class ProfileFieldValidator
{
    public static string RequireName(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{fieldName} is required.");

        var trimmed = value.Trim();
        if (trimmed.Length > 100)
            throw new ArgumentException($"{fieldName} is too long.");

        return trimmed;
    }

    public static string? NormalizeJobTitle(string? jobTitle)
    {
        if (string.IsNullOrWhiteSpace(jobTitle))
            return null;

        var trimmed = jobTitle.Trim();
        if (trimmed.Length > 200)
            throw new ArgumentException("Job title is too long.");

        return trimmed;
    }

    public static string? NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        var trimmed = phone.Trim();
        if (trimmed.Length > 32)
            throw new ArgumentException("Phone number is too long.");

        if (trimmed.Any(c => !char.IsDigit(c) && c is not '+' and not ' ' and not '-' and not '(' and not ')'))
            throw new ArgumentException("Phone number contains invalid characters.");

        return trimmed;
    }
}
