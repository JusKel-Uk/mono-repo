using Microsoft.EntityFrameworkCore;
using notifications.Contracts;
using notifications.Core.Persistence;

namespace notifications.Core.Features.GetInbox;

internal sealed record GetInboxQuery(Guid UserId, Guid OrganisationId);

internal sealed class GetInboxHandler
{
    private readonly NotificationDbContext _db;

    public GetInboxHandler(NotificationDbContext db)
    {
        _db = db;
    }

    public async Task<InboxListResponse> HandleAsync(GetInboxQuery query, CancellationToken ct)
    {
        var rows = await _db.InboxItems
            .AsNoTracking()
            .Where(i => i.UserId == query.UserId && i.OrganisationId == query.OrganisationId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new
            {
                i.Id,
                i.Title,
                i.Category,
                i.Body,
                i.CreatedAt,
                i.Read,
                i.ActionUrl,
            })
            .ToListAsync(ct);

        var items = rows
            .Select(i => new InboxItemDto(
                i.Id,
                i.Title,
                NotificationCategoryDisplay.ToInboxLabel(i.Category),
                i.Body,
                i.CreatedAt,
                i.Read,
                i.ActionUrl))
            .ToList();

        return new InboxListResponse(items);
    }
}
