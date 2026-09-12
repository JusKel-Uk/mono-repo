using Microsoft.EntityFrameworkCore;
using notifications.Core.Entities;

namespace notifications.Core.Persistence;

internal sealed class NotificationDbContext : DbContext
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options)
        : base(options)
    {
    }

    public DbSet<InboxItem> InboxItems => Set<InboxItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("notifications");
        modelBuilder.ApplyConfiguration(new InboxItemEntityConfiguration());
    }
}
