using lender.Core.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace lender.Core;

public static class LenderDatabaseStartup
{
    public static async Task MigrateLenderAsync(
        this IHost host,
        CancellationToken cancellationToken = default)
    {
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LenderDbContext>();
        await db.Database.MigrateAsync(cancellationToken);
    }
}
