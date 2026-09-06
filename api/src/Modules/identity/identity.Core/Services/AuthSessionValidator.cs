using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Services;

internal sealed class AuthSessionValidator : IAuthSessionValidator
{
    private readonly IdentityDbContext _db;

    public AuthSessionValidator(IdentityDbContext db)
    {
        _db = db;
    }

    public Task<bool> IsActiveAsync(string jti, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
            return Task.FromResult(false);

        var now = DateTime.UtcNow;
        return _db.AuthSessions
            .AsNoTracking()
            .AnyAsync(
                s => s.Jti == jti && s.RevokedAt == null && s.ExpiresAt > now,
                ct);
    }
}
