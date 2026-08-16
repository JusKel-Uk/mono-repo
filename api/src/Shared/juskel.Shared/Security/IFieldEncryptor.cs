namespace juskel.Shared.Security;

public interface IFieldEncryptor
{
    string Encrypt(string plaintext, string purpose);

    string Decrypt(string ciphertext, string purpose);
}
