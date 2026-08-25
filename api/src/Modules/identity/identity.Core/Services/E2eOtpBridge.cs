namespace identity.Core.Services;

/// <summary>
/// Development-only OTP bridge for real-API E2E runners (see api/scripts/e2e-onboarding-api.mjs).
/// </summary>
internal static class E2eOtpBridge
{
    public static void LogOtpIfDevelopment(string email, string plainCode)
    {
        if (!string.Equals(
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                "Development",
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        Console.WriteLine($"[E2E_OTP] {email}: {plainCode}");

        var otpFile = Environment.GetEnvironmentVariable("E2E_OTP_FILE");
        if (!string.IsNullOrWhiteSpace(otpFile))
        {
            File.AppendAllText(otpFile, $"{email}:{plainCode}\n");
        }
    }
}
