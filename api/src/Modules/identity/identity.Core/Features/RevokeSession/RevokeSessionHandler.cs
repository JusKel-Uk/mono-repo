using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.RevokeSession;

internal sealed class RevokeSessionHandler
{
    private readonly IdentityDbContext _db;

    public RevokeSessionHandler(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<bool> HandleAsync(Guid userId, Guid sessionId, CancellationToken ct = default)
    {
        var session = await _db.AuthSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, ct);

        if (session is null)
            return false;

        if (session.RevokedAt is null)
        {
            session.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        return true;
    }
}
