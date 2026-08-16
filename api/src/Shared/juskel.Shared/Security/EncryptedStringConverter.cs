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
            plaintext => GetEncryptor().Encrypt(plaintext, purpose),
            ciphertext => GetEncryptor().Decrypt(ciphertext, purpose))
    {
        ArgumentException.ThrowIfNullOrEmpty(purpose);
    }

    private static IFieldEncryptor GetEncryptor()
    {
        return _encryptor
            ?? throw new InvalidOperationException(
                "EncryptedStringConverter is not initialized. Call EncryptedStringConverter.Initialize at startup.");
    }
}
