using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.GetMe;

internal sealed class GetMeHandler
{
    private readonly IdentityDbContext _db;

    public GetMeHandler(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<MeProfileDto?> HandleAsync(GetMeQuery query, CancellationToken ct = default)
    {
        return await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == query.UserId && u.DeletedAt == null)
            .Select(u => new MeProfileDto(
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.JobTitle,
                u.Phone,
                u.AccountClosureRequestedAt))
            .FirstOrDefaultAsync(ct);
    }
}
