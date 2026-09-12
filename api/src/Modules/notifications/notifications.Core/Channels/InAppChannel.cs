using notifications.Contracts;
using notifications.Core.Entities;
using notifications.Core.Persistence;

namespace notifications.Core.Channels;

internal sealed class InAppChannel
{
    private readonly NotificationDbContext _db;

    public InAppChannel(NotificationDbContext db)
    {
        _db = db;
    }

    public async Task<(ChannelDeliveryResult Result, Guid? InboxItemId)> DeliverAsync(
        NotifyCommand command,
        CancellationToken ct)
    {
        var item = new InboxItem
        {
            Id = Guid.NewGuid(),
            UserId = command.UserId,
            OrganisationId = command.OrganisationId,
            Category = command.Category,
            Title = command.Title,
            Body = command.Body,
            ActionUrl = command.ActionUrl,
            Read = false,
            CreatedAt = DateTime.UtcNow,
            InAppDelivered = true,
            EmailDelivered = false,
        };

        _db.InboxItems.Add(item);
        await _db.SaveChangesAsync(ct);

        return (new ChannelDeliveryResult(true, false), item.Id);
    }

    public async Task MarkEmailDeliveredAsync(Guid inboxItemId, CancellationToken ct)
    {
        var item = await _db.InboxItems.FindAsync([inboxItemId], ct);
        if (item is null)
            return;

        item.EmailDelivered = true;
        await _db.SaveChangesAsync(ct);
    }
}
