using Microsoft.AspNetCore.DataProtection;

namespace juskel.Shared.Security;

public sealed class DataProtectionFieldEncryptor : IFieldEncryptor
{
    private readonly IDataProtectionProvider _provider;

    public DataProtectionFieldEncryptor(IDataProtectionProvider provider)
    {
        _provider = provider;
    }

    public string Encrypt(string plaintext, string purpose)
    {
        ArgumentException.ThrowIfNullOrEmpty(plaintext);
        ArgumentException.ThrowIfNullOrEmpty(purpose);

        return _provider.CreateProtector(purpose).Protect(plaintext);
    }

    public string Decrypt(string ciphertext, string purpose)
    {
        ArgumentException.ThrowIfNullOrEmpty(ciphertext);
        ArgumentException.ThrowIfNullOrEmpty(purpose);

        return _provider.CreateProtector(purpose).Unprotect(ciphertext);
    }
}
