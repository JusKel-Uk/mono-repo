using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.ListSessions;

internal sealed class ListSessionsHandler
{
    private readonly IdentityDbContext _db;

    public ListSessionsHandler(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<SessionListResponse> HandleAsync(
        ListSessionsQuery query,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var rows = await _db.AuthSessions
            .AsNoTracking()
            .Where(s => s.UserId == query.UserId && s.RevokedAt == null && s.ExpiresAt > now)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SessionDto(
                s.Id,
                s.DeviceLabel,
                s.CreatedAt,
                s.ExpiresAt,
                query.CurrentJti != null && s.Jti == query.CurrentJti))
            .ToListAsync(ct);

        return new SessionListResponse(rows);
    }
}
