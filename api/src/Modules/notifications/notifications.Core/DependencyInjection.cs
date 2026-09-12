using identity.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using notifications.Contracts;
using notifications.Core.Channels;
using notifications.Core.Features.GetInbox;
using notifications.Core.Features.GetUnreadCount;
using notifications.Core.Features.MarkAllRead;
using notifications.Core.Features.MarkRead;
using notifications.Core.Gateway;
using notifications.Core.Persistence;

namespace notifications.Core;

public static class DependencyInjection
{
    public static IServiceCollection AddNotificationsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Notifications")
            ?? throw new InvalidOperationException("Connection string 'Notifications' not found.");

        services.AddDbContextPool<NotificationDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
                sql.MigrationsHistoryTable("__EFMigrationsHistory", "notifications")));

        services.AddScoped<INotificationModule, NotificationGateway>();
        services.AddScoped<InAppChannel>();
        services.AddScoped<EmailChannel>();
        services.AddScoped<GetInboxHandler>();
        services.AddScoped<GetUnreadCountHandler>();
        services.AddScoped<MarkReadHandler>();
        services.AddScoped<MarkAllReadHandler>();
        return services;
    }
}
