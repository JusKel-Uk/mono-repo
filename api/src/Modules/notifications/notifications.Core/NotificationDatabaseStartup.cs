using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using notifications.Core.Persistence;

namespace notifications.Core;

public static class NotificationDatabaseStartup
{
    public static async Task MigrateNotificationsAsync(
        this IHost host,
        CancellationToken cancellationToken = default)
    {
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
        await db.Database.MigrateAsync(cancellationToken);
    }
}
