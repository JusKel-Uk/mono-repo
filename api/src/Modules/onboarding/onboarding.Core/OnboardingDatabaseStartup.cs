using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using onboarding.Core.Persistence;

namespace onboarding.Core;

public static class OnboardingDatabaseStartup
{
    public static async Task MigrateOnboardingAsync(
        this IHost host,
        CancellationToken cancellationToken = default)
    {
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OnboardingDbContext>();
        await db.Database.MigrateAsync(cancellationToken);
    }
}