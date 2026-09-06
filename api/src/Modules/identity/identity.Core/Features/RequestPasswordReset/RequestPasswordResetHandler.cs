using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using identity.Core.Services;
using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.RequestPasswordReset;

internal sealed class RequestPasswordResetHandler
{
    internal const string GenericMessage =
        "If an account exists for this email, a password reset code has been sent.";

    private readonly IdentityDbContext _db;
    private readonly IPasswordResetOtpService _otpService;
    private readonly IPasswordResetNotifier _notifier;
    private readonly IEmailLookupHasher _emailLookupHasher;

    public RequestPasswordResetHandler(
        IdentityDbContext db,
        IPasswordResetOtpService otpService,
        IPasswordResetNotifier notifier,
        IEmailLookupHasher emailLookupHasher)
    {
        _db = db;
        _otpService = otpService;
        _notifier = notifier;
        _emailLookupHasher = emailLookupHasher;
    }

    public async Task<PasswordResetAcceptedResponse> HandleAsync(
        RequestPasswordResetCommand command,
        CancellationToken ct = default)
    {
        var user = await FindUserAsync(command, ct);

        if (user is not null && user.EmailVerified)
        {
            var now = DateTime.UtcNow;
            await _db.PasswordResetRequests
                .Where(r => r.UserId == user.Id && r.ConsumedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(r => r.ConsumedAt, now), ct);

            var request = new PasswordResetRequest
            {
                Id = Guid.NewGuid(),
                UserId = user.Id
            };

            var (plainCode, displayCode) = _otpService.IssueOtp(request);
            _db.PasswordResetRequests.Add(request);
            await _db.SaveChangesAsync(ct);

            E2eOtpBridge.LogOtpIfDevelopment(user.Email, plainCode);
            await _notifier.SendResetOtpAsync(user, displayCode, ct);
        }

        return new PasswordResetAcceptedResponse(GenericMessage);
    }

    private async Task<User?> FindUserAsync(RequestPasswordResetCommand command, CancellationToken ct)
    {
        if (command.UserId is { } userId)
        {
            return await _db.Users
                .FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null, ct);
        }

        if (string.IsNullOrWhiteSpace(command.Email))
            throw new ArgumentException("Email is required.");

        var emailLookupHash = _emailLookupHasher.ComputeHash(command.Email);
        return await _db.Users
            .FirstOrDefaultAsync(
                u => u.EmailLookupHash == emailLookupHash && u.DeletedAt == null,
                ct);
    }
}
