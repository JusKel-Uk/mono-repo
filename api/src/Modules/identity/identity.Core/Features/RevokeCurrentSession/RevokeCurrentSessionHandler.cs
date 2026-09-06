using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.RevokeCurrentSession;

internal sealed class RevokeCurrentSessionHandler
{
    private readonly IdentityDbContext _db;

    public RevokeCurrentSessionHandler(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task HandleAsync(Guid userId, string jti, CancellationToken ct = default)
    {
        var session = await _db.AuthSessions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Jti == jti, ct);

        if (session is not null && session.RevokedAt is null)
        {
            session.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }
}
