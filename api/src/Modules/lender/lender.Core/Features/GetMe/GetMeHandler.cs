using identity.Contracts;
using lender.Contracts;
using lender.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace lender.Core.Features.GetMe;

internal sealed class GetMeHandler
{
    private readonly LenderDbContext _db;
    private readonly IIdentityModule _identity;

    public GetMeHandler(LenderDbContext db, IIdentityModule identity)
    {
        _db = db;
        _identity = identity;
    }

    public async Task<LenderMeResponse?> HandleAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _identity.GetUserAsync(userId, ct);
        if (user is null)
            return null;

        var membership = await _db.LenderMembers
            .AsNoTracking()
            .Include(m => m.LenderOrganisation)
            .Where(m => m.UserId == userId)
            .OrderBy(m => m.JoinedAt)
            .FirstOrDefaultAsync(ct);

        if (membership is null)
            return null;

        return new LenderMeResponse(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            new LenderOrganisationSummaryDto(
                membership.LenderOrganisationId,
                membership.LenderOrganisation.Name));
    }
}
