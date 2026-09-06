using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.RequestAccountClosure;

internal sealed class RequestAccountClosureHandler
{
    public const string RequestedStatus = "requested";

    private readonly IdentityDbContext _db;

    public RequestAccountClosureHandler(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<AccountClosureResponse?> HandleAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null, ct);

        if (user is null)
            return null;

        if (user.AccountClosureRequestedAt is null)
        {
            user.AccountClosureRequestedAt = DateTime.UtcNow;
            user.UpdatedAt = user.AccountClosureRequestedAt.Value;
            await _db.SaveChangesAsync(ct);
        }

        return new AccountClosureResponse(
            RequestedStatus,
            DateTime.SpecifyKind(user.AccountClosureRequestedAt.Value, DateTimeKind.Utc));
    }
}
