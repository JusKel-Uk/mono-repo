using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core;

internal sealed class IdentityModule : IIdentityModule
{
    private readonly IdentityDbContext _db;

    public IdentityModule(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<UserSummaryDto?> GetUserAsync(
        Guid id,
        CancellationToken ct = default)
    {
        if (id == Guid.Empty)
            return null;

        return await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == id && u.DeletedAt == null)
            .Select(u => new UserSummaryDto(u.Id, u.Email, u.FirstName, u.LastName))
            .FirstOrDefaultAsync(ct);
    }
}