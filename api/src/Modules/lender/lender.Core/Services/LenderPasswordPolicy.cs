namespace lender.Core.Services;

internal static class LenderPasswordPolicy
{
    public static void Validate(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password is required.");

        if (password.Length < 12)
            throw new ArgumentException("Use at least 12 characters.");

        if (!password.Any(char.IsLower))
            throw new ArgumentException("Include a lowercase letter.");

        if (!password.Any(char.IsUpper))
            throw new ArgumentException("Include an uppercase letter.");

        if (!password.Any(char.IsDigit))
            throw new ArgumentException("Include a number.");

        if (!password.Any(ch => !char.IsLetterOrDigit(ch)))
            throw new ArgumentException("Include a special symbol.");
    }
}
