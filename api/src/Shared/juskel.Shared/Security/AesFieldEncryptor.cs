using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace juskel.Shared.Security;

/// <summary>
/// Static-key field encryption (AES-256-GCM). Key comes from configuration/secrets —
/// survives container restarts; rotation is manual via env + re-encrypt backfill.
/// </summary>
public sealed class AesFieldEncryptor : IFieldEncryptor
{
    private const string Prefix = "j1:";
    private const int NonceSize = 12;
    private const int TagSize = 16;

    private readonly byte[] _key;

    public AesFieldEncryptor(IOptions<EncryptionOptions> options)
    {
        var fieldKey = options.Value.FieldKey;

        if (string.IsNullOrWhiteSpace(fieldKey) || fieldKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Encryption:FieldKey must be configured with at least 32 characters.");
        }

        _key = SHA256.HashData(Encoding.UTF8.GetBytes(fieldKey));
    }

    public string Encrypt(string plaintext, string purpose)
    {
        ArgumentException.ThrowIfNullOrEmpty(plaintext);
        ArgumentException.ThrowIfNullOrEmpty(purpose);

        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var plainBytes = Encoding.UTF8.GetBytes(plaintext);
        var cipherBytes = new byte[plainBytes.Length];
        var tag = new byte[TagSize];
        var purposeBytes = Encoding.UTF8.GetBytes(purpose);

        using var aes = new AesGcm(_key, TagSize);
        aes.Encrypt(nonce, plainBytes, cipherBytes, tag, purposeBytes);

        var payload = new byte[NonceSize + TagSize + cipherBytes.Length];
        Buffer.BlockCopy(nonce, 0, payload, 0, NonceSize);
        Buffer.BlockCopy(tag, 0, payload, NonceSize, TagSize);
        Buffer.BlockCopy(cipherBytes, 0, payload, NonceSize + TagSize, cipherBytes.Length);

        return Prefix + Convert.ToBase64String(payload);
    }

    public string Decrypt(string ciphertext, string purpose)
    {
        ArgumentException.ThrowIfNullOrEmpty(ciphertext);
        ArgumentException.ThrowIfNullOrEmpty(purpose);

        if (!ciphertext.StartsWith(Prefix, StringComparison.Ordinal))
        {
            // Pre-encryption plaintext rows (dev backfill / legacy).
            return ciphertext;
        }

        var payload = Convert.FromBase64String(ciphertext[Prefix.Length..]);

        if (payload.Length < NonceSize + TagSize)
            throw new CryptographicException("Encrypted payload is too short.");

        var nonce = payload.AsSpan(0, NonceSize);
        var tag = payload.AsSpan(NonceSize, TagSize);
        var cipherBytes = payload.AsSpan(NonceSize + TagSize);
        var plainBytes = new byte[cipherBytes.Length];
        var purposeBytes = Encoding.UTF8.GetBytes(purpose);

        using var aes = new AesGcm(_key, TagSize);
        aes.Decrypt(nonce, cipherBytes, tag, plainBytes, purposeBytes);

        return Encoding.UTF8.GetString(plainBytes);
    }
}
