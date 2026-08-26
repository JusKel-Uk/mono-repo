namespace juskel.Integrations.OpenBanking;

public sealed record OpenBankingAuthorizationResult(string AuthorizationUrl, string State);

public sealed record OpenBankingTokenResult(
    string AccessToken,
    string? RefreshToken,
    DateTime? ExpiresAt);

public sealed record OpenBankingAccountSummary(
    string AccountId,
    string DisplayName,
    decimal CurrentBalance,
    string Currency);

public interface IOpenBankingProvider
{
    OpenBankingAuthorizationResult BuildAuthorizationUrl(Guid applicationId, Guid userId);

    Task<OpenBankingTokenResult> ExchangeCodeAsync(string code, CancellationToken ct = default);

    Task<IReadOnlyList<OpenBankingAccountSummary>> GetAccountsAsync(
        string accessToken,
        CancellationToken ct = default);
}
