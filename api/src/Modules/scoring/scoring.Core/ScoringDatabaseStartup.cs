using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using scoring.Core.Persistence;

namespace scoring.Core;

public static class ScoringDatabaseStartup
{
    public static async Task MigrateScoringAsync(
        this IHost host,
        CancellationToken cancellationToken = default)
    {
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ScoringDbContext>();
        await db.Database.MigrateAsync(cancellationToken);
    }
}
