namespace juskel.Integrations.OpenBanking;

public sealed record OpenBankingAuthorizationResult(string AuthorizationUrl, string State);

public sealed record OpenBankingTokenResult(
    string AccessToken,
    string? RefreshToken,
    DateTime? ExpiresAt);

public sealed record OpenBankingInstitutionSummary(
    string InstitutionId,
    string InstitutionName);

public sealed record OpenBankingAccountSummary(
    string AccountId,
    string DisplayName,
    decimal CurrentBalance,
    string Currency,
    string InstitutionId,
    string InstitutionName);

public sealed record OpenBankingTransactionSummary(
    string TransactionId,
    DateTime Timestamp,
    decimal Amount,
    string Currency,
    string? Description);

public sealed record OpenBankingConnectionSnapshot(
    OpenBankingInstitutionSummary Institution,
    IReadOnlyList<OpenBankingAccountSummary> Accounts,
    IReadOnlyList<OpenBankingTransactionSummary> Transactions);

public interface IOpenBankingProvider
{
    OpenBankingAuthorizationResult BuildAuthorizationUrl(Guid applicationId, Guid userId);

    Task<OpenBankingTokenResult> ExchangeCodeAsync(string code, CancellationToken ct = default);

    Task<IReadOnlyList<OpenBankingAccountSummary>> GetAccountsAsync(
        string accessToken,
        CancellationToken ct = default);

    Task<decimal> GetBalanceAsync(string accessToken, string accountId, CancellationToken ct = default);

    Task<IReadOnlyList<OpenBankingTransactionSummary>> GetTransactionsAsync(
        string accessToken,
        string accountId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default);

    Task<OpenBankingConnectionSnapshot> FetchConnectionSnapshotAsync(
        string accessToken,
        int transactionDays,
        CancellationToken ct = default);
}
