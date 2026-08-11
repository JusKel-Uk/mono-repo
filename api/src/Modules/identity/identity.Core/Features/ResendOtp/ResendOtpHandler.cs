using identity.Contracts;
using identity.Core.Persistence;
using identity.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.ResendOtp;

internal sealed class ResendOtpHandler
{
    private const string GenericMessage =
        "If an unverified account exists for this email, a new verification code has been sent.";

    private readonly IdentityDbContext _db;
    private readonly IEmailOtpService _emailOtpService;
    private readonly IEmailVerificationNotifier _emailVerificationNotifier;

    public ResendOtpHandler(
        IdentityDbContext db,
        IEmailOtpService emailOtpService,
        IEmailVerificationNotifier emailVerificationNotifier)
    {
        _db = db;
        _emailOtpService = emailOtpService;
        _emailVerificationNotifier = emailVerificationNotifier;
    }

    public async Task<ResendOtpResponse> HandleAsync(
        ResendOtpCommand command,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Email))
            throw new ArgumentException("Email is required.");

        var email = command.Email.Trim().ToLowerInvariant();

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null, ct);

        if (user is not null && !user.EmailVerified)
        {
            var otp = _emailOtpService.IssueOtp(user);
            await _db.SaveChangesAsync(ct);
            await _emailVerificationNotifier.SendVerificationOtpAsync(user, otp.DisplayCode, ct);
        }

        return new ResendOtpResponse(GenericMessage);
    }
}
