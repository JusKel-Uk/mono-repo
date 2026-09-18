using lender.Contracts;
using lender.Core.Persistence;
using lender.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace lender.Core.Features.Admin;

internal sealed class RejectAccessRequestHandler
{
    private readonly LenderDbContext _db;
    private readonly ILenderAccessRequestNotifier _notifier;

    public RejectAccessRequestHandler(LenderDbContext db, ILenderAccessRequestNotifier notifier)
    {
        _db = db;
        _notifier = notifier;
    }

    public async Task<LenderAccessRequestSummaryDto?> HandleAsync(
        Guid id,
        LenderRejectAccessRequest request,
        CancellationToken ct = default)
    {
        var accessRequest = await _db.LenderAccessRequests
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (accessRequest is null)
            return null;

        if (accessRequest.Status != LenderAccessRequestStatus.Pending)
            throw new ArgumentException("Only pending requests can be rejected.");

        var now = DateTime.UtcNow;
        accessRequest.Status = LenderAccessRequestStatus.Rejected;
        accessRequest.ReviewedAt = now;
        accessRequest.RejectionReason = string.IsNullOrWhiteSpace(request.Reason)
            ? null
            : request.Reason.Trim();

        await _db.SaveChangesAsync(ct);
        await _notifier.SendRejectionAsync(accessRequest, accessRequest.RejectionReason, ct);

        return new LenderAccessRequestSummaryDto(
            accessRequest.Id,
            accessRequest.Status,
            accessRequest.FirstName,
            accessRequest.LastName,
            accessRequest.WorkEmail,
            accessRequest.Organisation,
            accessRequest.Website,
            accessRequest.JobTitle,
            accessRequest.Message,
            accessRequest.CreatedAt,
            accessRequest.ReviewedAt,
            accessRequest.RejectionReason);
    }
}
