using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace juskel.Shared.Security;

public sealed class EmailLookupHasher : IEmailLookupHasher
{
    private readonly byte[] _keyBytes;

    public EmailLookupHasher(IOptions<EncryptionOptions> options)
    {
        var key = options.Value.EmailLookupKey;

        if (string.IsNullOrWhiteSpace(key) || key.Length < 32)
        {
            throw new InvalidOperationException(
                "Encryption:EmailLookupKey must be configured with at least 32 characters (user secrets).");
        }

        _keyBytes = Encoding.UTF8.GetBytes(key);
    }

    public string NormalizeEmail(string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        return email.Trim().ToLowerInvariant();
    }

    public string ComputeHash(string email)
    {
        var normalized = NormalizeEmail(email);
        var payload = Encoding.UTF8.GetBytes(normalized);

        var hash = HMACSHA256.HashData(_keyBytes, payload);
        return Convert.ToHexString(hash);
    }
}
