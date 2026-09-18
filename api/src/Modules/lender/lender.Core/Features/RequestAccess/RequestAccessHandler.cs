using juskel.Shared.Security;
using lender.Contracts;
using lender.Core.Entities;
using lender.Core.Persistence;
using lender.Core.Services;
using lender.Core.Validation;
using Microsoft.EntityFrameworkCore;

namespace lender.Core.Features.RequestAccess;

internal sealed class RequestAccessHandler
{
    private readonly LenderDbContext _db;
    private readonly IEmailLookupHasher _emailLookupHasher;
    private readonly ILenderAccessRequestNotifier _notifier;

    public RequestAccessHandler(
        LenderDbContext db,
        IEmailLookupHasher emailLookupHasher,
        ILenderAccessRequestNotifier notifier)
    {
        _db = db;
        _emailLookupHasher = emailLookupHasher;
        _notifier = notifier;
    }

    public async Task<LenderAccessRequestAcceptedResponse> HandleAsync(
        LenderRequestAccessRequest request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName))
            throw new ArgumentException("First name is required.");

        if (string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Last name is required.");

        if (string.IsNullOrWhiteSpace(request.WorkEmail))
            throw new ArgumentException("Business email is required.");

        if (!LenderBusinessEmailValidator.IsBusinessEmail(request.WorkEmail))
            throw new ArgumentException("A business email address is required.");

        if (string.IsNullOrWhiteSpace(request.Organisation))
            throw new ArgumentException("Organisation name is required.");

        var email = _emailLookupHasher.NormalizeEmail(request.WorkEmail);
        var emailLookupHash = _emailLookupHasher.ComputeHash(email);

        var existingPending = await _db.LenderAccessRequests
            .FirstOrDefaultAsync(
                r => r.WorkEmailLookupHash == emailLookupHash
                    && r.Status == LenderAccessRequestStatus.Pending,
                ct);

        if (existingPending is not null)
            return new LenderAccessRequestAcceptedResponse(existingPending.Id);

        var now = DateTime.UtcNow;
        var accessRequest = new LenderAccessRequest
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            WorkEmail = email,
            WorkEmailLookupHash = emailLookupHash,
            Organisation = request.Organisation.Trim(),
            Website = NormalizeOptional(request.Website),
            JobTitle = NormalizeOptional(request.Role),
            Message = NormalizeOptional(request.Message),
            Status = LenderAccessRequestStatus.Pending,
            CreatedAt = now,
        };

        _db.LenderAccessRequests.Add(accessRequest);
        await _db.SaveChangesAsync(ct);
        await _notifier.NotifyAdminAsync(accessRequest, ct);

        return new LenderAccessRequestAcceptedResponse(accessRequest.Id);
    }

    private static string? NormalizeOptional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }
}
