namespace juskel.Integrations.QuickBooks;

public sealed record OAuthAuthorizationResult(string AuthorizationUrl, string State);

public sealed record OAuthTokenResult(
    string AccessToken,
    string? RefreshToken,
    DateTime? ExpiresAt);

public interface IQuickBooksClient
{
    OAuthAuthorizationResult BuildAuthorizationUrl(Guid applicationId, Guid userId);

    Task<OAuthTokenResult> ExchangeCodeAsync(string code, CancellationToken ct = default);

    Task<OAuthTokenResult> RefreshAccessTokenAsync(string refreshToken, CancellationToken ct = default);

    Task<QuickBooksSyncResult> SyncFinancialDataAsync(
        string accessToken,
        string? refreshToken,
        string realmId,
        CancellationToken ct = default);
}
