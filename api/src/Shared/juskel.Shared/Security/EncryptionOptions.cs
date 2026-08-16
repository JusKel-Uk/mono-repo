namespace juskel.Shared.Security;

public sealed class EncryptionOptions
{
    public const string SectionName = "Encryption";

    public string EmailLookupKey { get; init; } = string.Empty;
}
