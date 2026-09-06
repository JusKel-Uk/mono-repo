using System.Security.Cryptography;
using identity.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;

namespace identity.Core.Services;

internal interface IPasswordResetOtpService
{
    (string PlainCode, string DisplayCode) IssueOtp(PasswordResetRequest request);

    EmailOtpVerifyResult VerifyOtp(PasswordResetRequest request, string submittedOtp);

    string IssueResetToken(PasswordResetRequest request);

    bool VerifyResetToken(PasswordResetRequest request, string secret);
}

internal sealed class PasswordResetOtpService : IPasswordResetOtpService
{
    public static readonly TimeSpan ResetTokenLifetime = TimeSpan.FromMinutes(15);

    private readonly PasswordHasher<PasswordResetRequest> _hasher = new();

    public (string PlainCode, string DisplayCode) IssueOtp(PasswordResetRequest request)
    {
        var plainCode = OtpCodes.Generate();
        var now = DateTime.UtcNow;

        request.OtpHash = _hasher.HashPassword(request, plainCode);
        request.OtpExpiresAt = now.Add(OtpCodes.Lifetime);
        request.OtpAttempts = 0;
        request.ResetTokenHash = null;
        request.ResetTokenExpiresAt = null;
        request.ConsumedAt = null;
        request.CreatedAt = now;

        return (plainCode, OtpCodes.FormatForDisplay(plainCode));
    }

    public EmailOtpVerifyResult VerifyOtp(PasswordResetRequest request, string submittedOtp)
    {
        if (request.ConsumedAt is not null)
            return EmailOtpVerifyResult.NotIssued;

        if (string.IsNullOrWhiteSpace(request.OtpHash))
            return EmailOtpVerifyResult.NotIssued;

        if (request.OtpExpiresAt < DateTime.UtcNow)
            return EmailOtpVerifyResult.Expired;

        if (request.OtpAttempts >= OtpCodes.MaxAttempts)
            return EmailOtpVerifyResult.TooManyAttempts;

        var normalized = OtpCodes.Normalize(submittedOtp);
        if (normalized.Length != OtpCodes.Length)
            return EmailOtpVerifyResult.InvalidCode;

        request.OtpAttempts++;

        var result = _hasher.VerifyHashedPassword(request, request.OtpHash, normalized);
        return result == PasswordVerificationResult.Failed
            ? EmailOtpVerifyResult.InvalidCode
            : EmailOtpVerifyResult.Success;
    }

    public string IssueResetToken(PasswordResetRequest request)
    {
        var secretBytes = RandomNumberGenerator.GetBytes(32);
        var secret = WebEncoders.Base64UrlEncode(secretBytes);
        var now = DateTime.UtcNow;

        request.ResetTokenHash = _hasher.HashPassword(request, secret);
        request.ResetTokenExpiresAt = now.Add(ResetTokenLifetime);

        return PasswordResetTokens.Combine(request.Id, secret);
    }

    public bool VerifyResetToken(PasswordResetRequest request, string secret)
    {
        if (request.ConsumedAt is not null)
            return false;

        if (string.IsNullOrWhiteSpace(request.ResetTokenHash) || request.ResetTokenExpiresAt is null)
            return false;

        if (request.ResetTokenExpiresAt < DateTime.UtcNow)
            return false;

        var result = _hasher.VerifyHashedPassword(request, request.ResetTokenHash, secret);
        return result != PasswordVerificationResult.Failed;
    }
}

internal static class PasswordResetTokens
{
    public static string Combine(Guid requestId, string secret) =>
        $"{requestId:N}.{secret}";

    public static bool TrySplit(string token, out Guid requestId, out string secret)
    {
        requestId = default;
        secret = string.Empty;

        var separator = token.IndexOf('.', StringComparison.Ordinal);
        if (separator <= 0 || separator == token.Length - 1)
            return false;

        if (!Guid.TryParseExact(token[..separator], "N", out requestId))
            return false;

        secret = token[(separator + 1)..];
        return secret.Length > 0;
    }
}
