using System.Globalization;
using System.Security.Cryptography;

namespace identity.Core.Services;

internal static class OtpCodes
{
    public const int Length = 6;
    public const int MaxAttempts = 5;
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    public static string Generate()
    {
        Span<byte> bytes = stackalloc byte[4];
        RandomNumberGenerator.Fill(bytes);
        var value = BitConverter.ToUInt32(bytes) % 1_000_000;
        return value.ToString("D6", CultureInfo.InvariantCulture);
    }

    public static string FormatForDisplay(string plainCode)
    {
        var normalized = Normalize(plainCode);
        return normalized.Length == Length
            ? $"{normalized[..3]} {normalized[3..]}"
            : normalized;
    }

    public static string Normalize(string otp) =>
        new string(otp.Where(char.IsDigit).ToArray());
}
