using lender.Contracts;
using lender.Core.Entities;
using lender.Core.Persistence;
using lender.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace lender.Core.Features.Admin;

internal sealed class ApproveAccessRequestHandler
{
    private readonly LenderDbContext _db;
    private readonly ILenderInviteTokenService _inviteTokens;
    private readonly ILenderAccessRequestNotifier _notifier;

    public ApproveAccessRequestHandler(
        LenderDbContext db,
        ILenderInviteTokenService inviteTokens,
        ILenderAccessRequestNotifier notifier)
    {
        _db = db;
        _inviteTokens = inviteTokens;
        _notifier = notifier;
    }

    public async Task<LenderAccessRequestSummaryDto?> HandleAsync(Guid id, CancellationToken ct = default)
    {
        var request = await _db.LenderAccessRequests
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (request is null)
            return null;

        if (request.Status != LenderAccessRequestStatus.Pending)
            throw new ArgumentException("Only pending requests can be approved.");

        var now = DateTime.UtcNow;
        var organisation = new LenderOrganisation
        {
            Id = Guid.NewGuid(),
            Name = request.Organisation,
            Website = request.Website,
            CreatedAt = now,
            UpdatedAt = now,
        };

        var (plainToken, tokenHash) = _inviteTokens.IssueToken();
        var invite = new LenderInvite
        {
            Id = Guid.NewGuid(),
            AccessRequestId = request.Id,
            LenderOrganisationId = organisation.Id,
            EmailLookupHash = request.WorkEmailLookupHash,
            TokenHash = tokenHash,
            ExpiresAt = now.AddDays(LenderInvite.ExpiryDays),
            CreatedAt = now,
        };

        request.Status = LenderAccessRequestStatus.Approved;
        request.ReviewedAt = now;
        request.LenderOrganisationId = organisation.Id;

        _db.LenderOrganisations.Add(organisation);
        _db.LenderInvites.Add(invite);
        await _db.SaveChangesAsync(ct);

        E2eLenderInviteBridge.LogInviteIfDevelopment(request.WorkEmail, plainToken);
        await _notifier.SendApprovalInviteAsync(request, organisation, plainToken, ct);

        return new LenderAccessRequestSummaryDto(
            request.Id,
            request.Status,
            request.FirstName,
            request.LastName,
            request.WorkEmail,
            request.Organisation,
            request.Website,
            request.JobTitle,
            request.Message,
            request.CreatedAt,
            request.ReviewedAt,
            request.RejectionReason);
    }
}
