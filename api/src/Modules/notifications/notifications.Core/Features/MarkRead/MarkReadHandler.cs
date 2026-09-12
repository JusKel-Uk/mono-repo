using Microsoft.EntityFrameworkCore;
using notifications.Core.Persistence;

namespace notifications.Core.Features.MarkRead;

internal sealed record MarkReadCommand(Guid UserId, Guid OrganisationId, Guid NotificationId);

internal sealed class MarkReadHandler
{
    private readonly NotificationDbContext _db;

    public MarkReadHandler(NotificationDbContext db)
    {
        _db = db;
    }

    public async Task<bool> HandleAsync(MarkReadCommand command, CancellationToken ct)
    {
        var item = await _db.InboxItems.FirstOrDefaultAsync(
            i => i.Id == command.NotificationId
                && i.UserId == command.UserId
                && i.OrganisationId == command.OrganisationId,
            ct);

        if (item is null)
            return false;

        if (!item.Read)
        {
            item.Read = true;
            item.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        return true;
    }
}
