namespace juskel.Integrations.Xero;

public sealed record OAuthAuthorizationResult(string AuthorizationUrl, string State);

public sealed record OAuthTokenResult(
    string AccessToken,
    string? RefreshToken,
    DateTime? ExpiresAt);

public interface IXeroClient
{
    OAuthAuthorizationResult BuildAuthorizationUrl(Guid applicationId, Guid userId);

    Task<OAuthTokenResult> ExchangeCodeAsync(string code, CancellationToken ct = default);
}
