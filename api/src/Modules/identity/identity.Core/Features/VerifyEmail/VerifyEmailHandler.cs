using identity.Contracts;
using identity.Core.Persistence;
using identity.Core.Services;
using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.VerifyEmail;

internal sealed class VerifyEmailHandler
{
    private readonly IdentityDbContext _db;
    private readonly IEmailOtpService _emailOtpService;
    private readonly IEmailLookupHasher _emailLookupHasher;

    public VerifyEmailHandler(
        IdentityDbContext db,
        IEmailOtpService emailOtpService,
        IEmailLookupHasher emailLookupHasher)
    {
        _db = db;
        _emailOtpService = emailOtpService;
        _emailLookupHasher = emailLookupHasher;
    }

    public async Task<VerifyEmailResponse> HandleAsync(
        VerifyEmailCommand command,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Email))
            throw new ArgumentException("Email is required.");

        if (string.IsNullOrWhiteSpace(command.OtpCode))
            throw new ArgumentException("Verification code is required.");

        var emailLookupHash = _emailLookupHasher.ComputeHash(command.Email);

        var user = await _db.Users
            .FirstOrDefaultAsync(
                u => u.EmailLookupHash == emailLookupHash && u.DeletedAt == null,
                ct)
            ?? throw new ArgumentException("Account not found.");

        if (user.EmailVerified)
            return new VerifyEmailResponse(user.Id, user.Email, true);

        var result = _emailOtpService.VerifyOtp(user, command.OtpCode);

        if (result != EmailOtpVerifyResult.Success)
        {
            await _db.SaveChangesAsync(ct);

            throw result switch
            {
                EmailOtpVerifyResult.InvalidCode =>
                    new ArgumentException("Invalid verification code."),
                EmailOtpVerifyResult.Expired =>
                    new ArgumentException("Verification code has expired."),
                EmailOtpVerifyResult.TooManyAttempts =>
                    new ArgumentException("Too many failed attempts. Request a new code."),
                EmailOtpVerifyResult.NotIssued =>
                    new ArgumentException("No verification code on file for this account."),
                _ => new InvalidOperationException("Unexpected verification result.")
            };
        }

        await _db.SaveChangesAsync(ct);

        return new VerifyEmailResponse(user.Id, user.Email, user.EmailVerified);
    }
}