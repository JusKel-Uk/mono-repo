using Microsoft.EntityFrameworkCore;
using notifications.Core.Persistence;

namespace notifications.Core.Features.MarkAllRead;

internal sealed record MarkAllReadCommand(Guid UserId, Guid OrganisationId);

internal sealed class MarkAllReadHandler
{
    private readonly NotificationDbContext _db;

    public MarkAllReadHandler(NotificationDbContext db)
    {
        _db = db;
    }

    public async Task<int> HandleAsync(MarkAllReadCommand command, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        return await _db.InboxItems
            .Where(i => i.UserId == command.UserId
                && i.OrganisationId == command.OrganisationId
                && !i.Read)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(i => i.Read, true)
                    .SetProperty(i => i.ReadAt, now),
                ct);
    }
}
