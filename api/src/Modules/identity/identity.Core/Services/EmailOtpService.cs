using System.Globalization;
using System.Security.Cryptography;
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
    private const int OtpLength = 6;
    private const int MaxAttempts = 5;
    private static readonly TimeSpan OtpLifetime = TimeSpan.FromMinutes(10);

    private readonly PasswordHasher<User> _passwordHasher = new();

    public EmailOtpIssueResult IssueOtp(User user)
    {
        var plainCode = GenerateOtpCode();
        var now = DateTime.UtcNow;

        user.EmailOtpHash = _passwordHasher.HashPassword(user, plainCode);
        user.EmailOtpExpiresAt = now.Add(OtpLifetime);
        user.EmailOtpAttempts = 0;
        user.UpdatedAt = now;

        return new EmailOtpIssueResult(plainCode, FormatOtpForDisplay(plainCode));
    }

    public EmailOtpVerifyResult VerifyOtp(User user, string submittedOtp)
    {
        if (string.IsNullOrWhiteSpace(user.EmailOtpHash) || user.EmailOtpExpiresAt is null)
            return EmailOtpVerifyResult.NotIssued;

        if (user.EmailOtpExpiresAt < DateTime.UtcNow)
            return EmailOtpVerifyResult.Expired;

        if (user.EmailOtpAttempts >= MaxAttempts)
            return EmailOtpVerifyResult.TooManyAttempts;

        var normalized = NormalizeOtp(submittedOtp);

        if (normalized.Length != OtpLength)
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

    private static string GenerateOtpCode()
    {
        Span<byte> bytes = stackalloc byte[4];
        RandomNumberGenerator.Fill(bytes);
        var value = BitConverter.ToUInt32(bytes) % 1_000_000;
        return value.ToString("D6", CultureInfo.InvariantCulture);
    }

    public static string FormatOtpForDisplay(string plainCode)
    {
        var normalized = NormalizeOtp(plainCode);
        return normalized.Length == 6
            ? $"{normalized[..3]} {normalized[3..]}"
            : normalized;
    }

    private static string NormalizeOtp(string otp) =>
        new string(otp.Where(char.IsDigit).ToArray());
}