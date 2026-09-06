using identity.Core.Entities;
using Microsoft.AspNetCore.Identity;

namespace identity.Core.Services;

internal interface IEmailOtpService
{
    EmailOtpIssueResult IssueOtp(User user);

    EmailOtpVerifyResult VerifyOtp(User user, string submittedOtp);
}

internal sealed record EmailOtpIssueResult(string PlainCode, string DisplayCode);

internal enum EmailOtpVerifyResult
{
    Success,
    InvalidCode,
    Expired,
    TooManyAttempts,
    NotIssued
}

internal sealed class EmailOtpService : IEmailOtpService
{
    private readonly PasswordHasher<User> _passwordHasher = new();

    public EmailOtpIssueResult IssueOtp(User user)
    {
        var plainCode = OtpCodes.Generate();
        var now = DateTime.UtcNow;

        user.EmailOtpHash = _passwordHasher.HashPassword(user, plainCode);
        user.EmailOtpExpiresAt = now.Add(OtpCodes.Lifetime);
        user.EmailOtpAttempts = 0;
        user.UpdatedAt = now;

        return new EmailOtpIssueResult(plainCode, OtpCodes.FormatForDisplay(plainCode));
    }

    public EmailOtpVerifyResult VerifyOtp(User user, string submittedOtp)
    {
        if (string.IsNullOrWhiteSpace(user.EmailOtpHash) || user.EmailOtpExpiresAt is null)
            return EmailOtpVerifyResult.NotIssued;

        if (user.EmailOtpExpiresAt < DateTime.UtcNow)
            return EmailOtpVerifyResult.Expired;

        if (user.EmailOtpAttempts >= OtpCodes.MaxAttempts)
            return EmailOtpVerifyResult.TooManyAttempts;

        var normalized = OtpCodes.Normalize(submittedOtp);

        if (normalized.Length != OtpCodes.Length)
            return EmailOtpVerifyResult.InvalidCode;

        user.EmailOtpAttempts++;
        user.UpdatedAt = DateTime.UtcNow;

        var result = _passwordHasher.VerifyHashedPassword(
            user,
            user.EmailOtpHash,
            normalized);

        if (result == PasswordVerificationResult.Failed)
            return EmailOtpVerifyResult.InvalidCode;

        var now = DateTime.UtcNow;
        user.EmailVerified = true;
        user.EmailVerifiedAt = now;
        user.EmailOtpHash = null;
        user.EmailOtpExpiresAt = null;
        user.EmailOtpAttempts = 0;
        user.UpdatedAt = now;

        return EmailOtpVerifyResult.Success;
    }
}
