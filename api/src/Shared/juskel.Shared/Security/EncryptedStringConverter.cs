using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace juskel.Shared.Security;

public sealed class EncryptedStringConverter : ValueConverter<string, string>
{
    private static IFieldEncryptor? _encryptor;

    public static void Initialize(IFieldEncryptor encryptor)
    {
        _encryptor = encryptor ?? throw new ArgumentNullException(nameof(encryptor));
    }

    public EncryptedStringConverter(string purpose)
        : base(
            plaintext => Encryptor().Encrypt(plaintext, purpose),
            ciphertext => Encryptor().Decrypt(ciphertext, purpose))
    {
        ArgumentException.ThrowIfNullOrEmpty(purpose);
    }

    internal static IFieldEncryptor Encryptor()
    {
        return _encryptor
            ?? throw new InvalidOperationException(
                "EncryptedStringConverter is not initialized. Call EncryptedStringConverter.Initialize at startup.");
    }
}

public sealed class EncryptedNullableStringConverter : ValueConverter<string?, string?>
{
    public EncryptedNullableStringConverter(string purpose)
        : base(
            plaintext => plaintext == null ? null : EncryptedStringConverter.Encryptor().Encrypt(plaintext, purpose),
            ciphertext => ciphertext == null ? null : EncryptedStringConverter.Encryptor().Decrypt(ciphertext, purpose))
    {
        ArgumentException.ThrowIfNullOrEmpty(purpose);
    }
}
