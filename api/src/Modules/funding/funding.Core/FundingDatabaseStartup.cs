using funding.Core.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace funding.Core;

public static class FundingDatabaseStartup
{
    public static async Task MigrateFundingAsync(
        this IHost host,
        CancellationToken cancellationToken = default)
    {
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FundingDbContext>();
        await db.Database.MigrateAsync(cancellationToken);
    }
}
