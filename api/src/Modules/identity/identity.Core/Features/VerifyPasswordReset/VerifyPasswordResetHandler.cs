using identity.Contracts;
using identity.Core.Persistence;
using identity.Core.Services;
using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.VerifyPasswordReset;

internal sealed class VerifyPasswordResetHandler
{
    private const string InvalidCodeMessage = "Invalid or expired reset code.";

    private readonly IdentityDbContext _db;
    private readonly IPasswordResetOtpService _otpService;
    private readonly IEmailLookupHasher _emailLookupHasher;

    public VerifyPasswordResetHandler(
        IdentityDbContext db,
        IPasswordResetOtpService otpService,
        IEmailLookupHasher emailLookupHasher)
    {
        _db = db;
        _otpService = otpService;
        _emailLookupHasher = emailLookupHasher;
    }

    public async Task<PasswordResetVerifyResponse> HandleAsync(
        PasswordResetVerifyRequest request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required.");

        if (string.IsNullOrWhiteSpace(request.Code))
            throw new ArgumentException("Reset code is required.");

        var emailLookupHash = _emailLookupHasher.ComputeHash(request.Email);
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.EmailLookupHash == emailLookupHash && u.DeletedAt == null,
                ct)
            ?? throw new ArgumentException(InvalidCodeMessage);

        var reset = await _db.PasswordResetRequests
            .Where(r => r.UserId == user.Id && r.ConsumedAt == null)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(ct)
            ?? throw new ArgumentException(InvalidCodeMessage);

        var result = _otpService.VerifyOtp(reset, request.Code);
        if (result != EmailOtpVerifyResult.Success)
        {
            await _db.SaveChangesAsync(ct);
            throw new ArgumentException(InvalidCodeMessage);
        }

        var token = _otpService.IssueResetToken(reset);
        await _db.SaveChangesAsync(ct);
        return new PasswordResetVerifyResponse(token);
    }
}
