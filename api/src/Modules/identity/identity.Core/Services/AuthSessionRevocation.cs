using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Services;

internal static class AuthSessionRevocation
{
    public static Task RevokeAllForUserAsync(
        IdentityDbContext db,
        Guid userId,
        DateTime utcNow,
        CancellationToken ct) =>
        db.AuthSessions
            .Where(s => s.UserId == userId && s.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.RevokedAt, utcNow), ct);
}
