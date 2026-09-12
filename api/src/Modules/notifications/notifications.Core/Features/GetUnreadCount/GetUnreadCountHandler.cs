using Microsoft.EntityFrameworkCore;
using notifications.Contracts;
using notifications.Core.Persistence;

namespace notifications.Core.Features.GetUnreadCount;

internal sealed record GetUnreadCountQuery(Guid UserId, Guid OrganisationId);

internal sealed class GetUnreadCountHandler
{
    private readonly NotificationDbContext _db;

    public GetUnreadCountHandler(NotificationDbContext db)
    {
        _db = db;
    }

    public async Task<UnreadCountResponse> HandleAsync(GetUnreadCountQuery query, CancellationToken ct)
    {
        var count = await _db.InboxItems
            .AsNoTracking()
            .CountAsync(
                i => i.UserId == query.UserId
                    && i.OrganisationId == query.OrganisationId
                    && !i.Read,
                ct);

        return new UnreadCountResponse(count);
    }
}
