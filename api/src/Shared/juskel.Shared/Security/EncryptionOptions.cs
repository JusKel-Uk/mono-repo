namespace juskel.Shared.Security;

public sealed class EncryptionOptions
{
    public const string SectionName = "Encryption";

    /// <summary>AES-256-GCM master key for email, first name, and last name at rest (min 32 chars).</summary>
    public string FieldKey { get; init; } = string.Empty;

    /// <summary>HMAC key for deterministic email lookup hashes (min 32 chars).</summary>
    public string EmailLookupKey { get; init; } = string.Empty;
}
