using lender.Contracts;
using lender.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace lender.Core.Features.Admin;

internal sealed class ListAccessRequestsHandler
{
    private readonly LenderDbContext _db;

    public ListAccessRequestsHandler(LenderDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<LenderAccessRequestSummaryDto>> HandleAsync(
        LenderAccessRequestStatus? status,
        CancellationToken ct = default)
    {
        var query = _db.LenderAccessRequests.AsNoTracking();

        if (status is not null)
            query = query.Where(r => r.Status == status);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new LenderAccessRequestSummaryDto(
                r.Id,
                r.Status,
                r.FirstName,
                r.LastName,
                r.WorkEmail,
                r.Organisation,
                r.Website,
                r.JobTitle,
                r.Message,
                r.CreatedAt,
                r.ReviewedAt,
                r.RejectionReason))
            .ToListAsync(ct);
    }
}
