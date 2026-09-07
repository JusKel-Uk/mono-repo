namespace identity.Core.Services;

internal static class E2eInviteBridge
{
    public static void LogInviteIfDevelopment(string email, string plainToken)
    {
        if (!string.Equals(
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                "Development",
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        Console.WriteLine($"[E2E_INVITE] {email}: {plainToken}");

        var inviteFile = Environment.GetEnvironmentVariable("E2E_INVITE_FILE");
        if (!string.IsNullOrWhiteSpace(inviteFile))
        {
            File.AppendAllText(inviteFile, $"{email}:{plainToken}\n");
        }
    }
}
