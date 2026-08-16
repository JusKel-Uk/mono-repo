using identity.Core.Persistence;
using identity.Core.Services;
using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace identity.Core;

public static class IdentityDatabaseStartup
{
    public static async Task MigrateAndBackfillPiiAsync(
        this IHost host,
        CancellationToken cancellationToken = default)
    {
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var emailLookupHasher = scope.ServiceProvider.GetRequiredService<IEmailLookupHasher>();

        await db.Database.MigrateAsync(cancellationToken);
        await IdentityPiiBackfill.RunAsync(db, emailLookupHasher, cancellationToken);
    }
}
