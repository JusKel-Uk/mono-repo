namespace identity.Contracts;

public interface IAuthSessionValidator
{
    Task<bool> IsActiveAsync(string jti, CancellationToken ct = default);
}
