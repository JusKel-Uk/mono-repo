using lender.Contracts;
using lender.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace lender.Core.Features.Admin;

internal sealed class GetAccessRequestHandler
{
    private readonly LenderDbContext _db;

    public GetAccessRequestHandler(LenderDbContext db)
    {
        _db = db;
    }

    public async Task<LenderAccessRequestSummaryDto?> HandleAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.LenderAccessRequests
            .AsNoTracking()
            .Where(r => r.Id == id)
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
            .FirstOrDefaultAsync(ct);
    }
}
