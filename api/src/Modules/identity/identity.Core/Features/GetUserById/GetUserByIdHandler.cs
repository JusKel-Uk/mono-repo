using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.GetUserById;

internal sealed class GetUserByIdHandler
{
    private readonly IdentityDbContext _db;

    public GetUserByIdHandler(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<UserSummaryDto?> HandleAsync(
        GetUserByIdQuery query,
        CancellationToken ct = default)
    {
        return await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == query.UserId && u.DeletedAt == null)
            .Select(u => new UserSummaryDto(u.Id, u.Email))
            .FirstOrDefaultAsync(ct);
    }
}