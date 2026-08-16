namespace juskel.Shared.Security;

public interface IEmailLookupHasher
{
    string NormalizeEmail(string email);

    string ComputeHash(string email);
}
