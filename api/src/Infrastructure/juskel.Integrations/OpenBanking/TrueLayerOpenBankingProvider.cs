using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace juskel.Integrations.OpenBanking;

public sealed class TrueLayerOpenBankingProvider : IOpenBankingProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly HttpClient _http;
    private readonly OpenBankingOptions _options;

    public TrueLayerOpenBankingProvider(HttpClient http, IOptions<OpenBankingOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public OpenBankingAuthorizationResult BuildAuthorizationUrl(Guid applicationId, Guid userId)
    {
        var state = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{applicationId}:{userId}:{Guid.NewGuid()}"));
        var query = new Dictionary<string, string>
        {
            ["response_type"] = "code",
            ["client_id"] = _options.ClientId,
            ["redirect_uri"] = _options.RedirectUri,
            ["scope"] = "info accounts balance transactions offline_access",
            ["state"] = state,
            ["providers"] = _options.Providers,
        };

        if (!string.IsNullOrWhiteSpace(_options.ProviderId))
        {
            query["provider_id"] = _options.ProviderId;
        }

        var url = $"{_options.AuthBaseUrl.TrimEnd('/')}/?{string.Join("&", query.Select(static kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"))}";
        return new OpenBankingAuthorizationResult(url, state);
    }

    public async Task<OpenBankingTokenResult> ExchangeCodeAsync(string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId) || string.IsNullOrWhiteSpace(_options.ClientSecret))
        {
            var stubInstitution = code.Contains("bank2", StringComparison.OrdinalIgnoreCase) ? "mock-b" : "mock-a";
            return new OpenBankingTokenResult(
                $"stub-access-token-{stubInstitution}-{Guid.NewGuid():N}",
                $"stub-refresh-token-{stubInstitution}-{Guid.NewGuid():N}",
                DateTime.UtcNow.AddHours(1));
        }

        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["client_id"] = _options.ClientId,
            ["client_secret"] = _options.ClientSecret,
            ["redirect_uri"] = _options.RedirectUri,
            ["code"] = code,
        });

        using var response = await _http.PostAsync(
            $"{_options.AuthBaseUrl.TrimEnd('/')}/connect/token",
            content,
            ct);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException(
                $"TrueLayer token exchange failed ({(int)response.StatusCode}): {errorBody}");
        }
        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<TokenPayload>(stream, JsonOptions, ct)
            ?? throw new InvalidOperationException("Open banking token response was empty.");

        var expiresAt = payload.ExpiresIn > 0
            ? DateTime.UtcNow.AddSeconds(payload.ExpiresIn)
            : (DateTime?)null;

        return new OpenBankingTokenResult(payload.AccessToken, payload.RefreshToken, expiresAt);
    }

    public async Task<IReadOnlyList<OpenBankingAccountSummary>> GetAccountsAsync(
        string accessToken,
        CancellationToken ct = default)
    {
        if (IsStubToken(accessToken))
            return BuildStubAccounts(accessToken);

        var accounts = await FetchAccountPayloadsAsync(accessToken, ct);
        var summaries = new List<OpenBankingAccountSummary>();

        foreach (var account in accounts)
        {
            var institution = ResolveInstitution(account);
            var balance = account.Balance?.Current
                ?? await GetBalanceAsync(accessToken, account.AccountId ?? string.Empty, ct);

            summaries.Add(new OpenBankingAccountSummary(
                account.AccountId ?? Guid.NewGuid().ToString(),
                account.DisplayName ?? "Account",
                balance,
                account.Currency ?? "GBP",
                institution.InstitutionId,
                institution.InstitutionName));
        }

        return summaries;
    }

    public async Task<decimal> GetBalanceAsync(
        string accessToken,
        string accountId,
        CancellationToken ct = default)
    {
        if (IsStubToken(accessToken))
            return accessToken.Contains("mock-b", StringComparison.Ordinal) ? 45_000m : 125_000m;

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{_options.ApiBaseUrl.TrimEnd('/')}/data/v1/accounts/{accountId}/balance");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<BalanceResponsePayload>(stream, JsonOptions, ct);
        return payload?.Results?.FirstOrDefault()?.Current ?? 0m;
    }

    public async Task<IReadOnlyList<OpenBankingTransactionSummary>> GetTransactionsAsync(
        string accessToken,
        string accountId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default)
    {
        if (IsStubToken(accessToken))
            return BuildStubTransactions(accessToken, from, to);

        var query = $"from={from:yyyy-MM-dd}&to={to:yyyy-MM-dd}";
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{_options.ApiBaseUrl.TrimEnd('/')}/data/v1/accounts/{accountId}/transactions?{query}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<TransactionsPayload>(stream, JsonOptions, ct);
        if (payload?.Results is null)
            return [];

        return payload.Results
            .Select(static tx => new OpenBankingTransactionSummary(
                tx.TransactionId ?? Guid.NewGuid().ToString(),
                ParseTimestamp(tx.Timestamp),
                tx.Amount,
                tx.Currency ?? "GBP",
                tx.Description))
            .ToList();
    }

    public async Task<OpenBankingConnectionSnapshot> FetchConnectionSnapshotAsync(
        string accessToken,
        int transactionDays,
        CancellationToken ct = default)
    {
        var accounts = await GetAccountsAsync(accessToken, ct);
        if (accounts.Count == 0)
        {
            return new OpenBankingConnectionSnapshot(
                new OpenBankingInstitutionSummary("unknown", "Unknown bank"),
                [],
                []);
        }

        var institution = new OpenBankingInstitutionSummary(
            accounts[0].InstitutionId,
            accounts[0].InstitutionName);

        var periodEnd = DateOnly.FromDateTime(DateTime.UtcNow);
        var periodStart = periodEnd.AddDays(-Math.Max(1, transactionDays));
        var transactions = new List<OpenBankingTransactionSummary>();

        foreach (var account in accounts)
        {
            var accountTransactions = await GetTransactionsAsync(
                accessToken,
                account.AccountId,
                periodStart,
                periodEnd,
                ct);
            transactions.AddRange(accountTransactions);
        }

        return new OpenBankingConnectionSnapshot(institution, accounts, transactions);
    }

    private async Task<List<AccountPayload>> FetchAccountPayloadsAsync(string accessToken, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{_options.ApiBaseUrl.TrimEnd('/')}/data/v1/accounts");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<AccountsPayload>(stream, JsonOptions, ct);
        return payload?.Results ?? [];
    }

    private static OpenBankingInstitutionSummary ResolveInstitution(AccountPayload account)
    {
        var providerId = account.Provider?.ProviderId;
        var displayName = account.Provider?.DisplayName;

        if (!string.IsNullOrWhiteSpace(providerId))
        {
            return new OpenBankingInstitutionSummary(
                providerId,
                string.IsNullOrWhiteSpace(displayName) ? providerId : displayName);
        }

        var fallbackName = displayName ?? account.DisplayName ?? "Unknown bank";
        var fallbackId = HashInstitutionId(fallbackName);
        return new OpenBankingInstitutionSummary(fallbackId, fallbackName);
    }

    private static string HashInstitutionId(string value)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(hash)[..16].ToLowerInvariant();
    }

    private static bool IsStubToken(string accessToken) =>
        accessToken.StartsWith("stub-access-token", StringComparison.Ordinal);

    private static IReadOnlyList<OpenBankingAccountSummary> BuildStubAccounts(string accessToken)
    {
        var isSecondBank = accessToken.Contains("mock-b", StringComparison.Ordinal);
        return
        [
            new OpenBankingAccountSummary(
                isSecondBank ? "stub-account-2" : "stub-account-1",
                isSecondBank ? "Secondary Business Current" : "Business Current",
                isSecondBank ? 45_000m : 125_000m,
                "GBP",
                isSecondBank ? "mock-b" : "mock-a",
                isSecondBank ? "Second Mock Bank" : "Mock Bank"),
        ];
    }

    private static IReadOnlyList<OpenBankingTransactionSummary> BuildStubTransactions(
        string accessToken,
        DateOnly from,
        DateOnly to)
    {
        var isSecondBank = accessToken.Contains("mock-b", StringComparison.Ordinal);
        var monthlyInflow = isSecondBank ? 12_000m : 28_000m;
        var monthlyOutflow = isSecondBank ? 9_500m : 22_000m;
        var transactions = new List<OpenBankingTransactionSummary>();
        var cursor = from;

        while (cursor <= to)
        {
            transactions.Add(new OpenBankingTransactionSummary(
                $"stub-credit-{cursor:yyyyMMdd}",
                cursor.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
                monthlyInflow,
                "GBP",
                "Customer payment"));

            transactions.Add(new OpenBankingTransactionSummary(
                $"stub-debit-{cursor:yyyyMMdd}",
                cursor.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
                -monthlyOutflow,
                "GBP",
                "Operating expense"));

            cursor = cursor.AddDays(7);
        }

        return transactions;
    }

    private static DateTime ParseTimestamp(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return DateTime.UtcNow;

        return DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsed)
            ? parsed.ToUniversalTime()
            : DateTime.UtcNow;
    }

    private sealed class TokenPayload
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }
    }

    private sealed class AccountsPayload
    {
        public List<AccountPayload>? Results { get; set; }
    }

    private sealed class AccountPayload
    {
        [JsonPropertyName("account_id")]
        public string? AccountId { get; set; }

        [JsonPropertyName("display_name")]
        public string? DisplayName { get; set; }

        public string? Currency { get; set; }

        public BalancePayload? Balance { get; set; }

        public ProviderPayload? Provider { get; set; }
    }

    private sealed class ProviderPayload
    {
        [JsonPropertyName("provider_id")]
        public string? ProviderId { get; set; }

        [JsonPropertyName("display_name")]
        public string? DisplayName { get; set; }
    }

    private sealed class BalancePayload
    {
        public decimal Current { get; set; }
    }

    private sealed class BalanceResponsePayload
    {
        public List<BalancePayload>? Results { get; set; }
    }

    private sealed class TransactionsPayload
    {
        public List<TransactionPayload>? Results { get; set; }
    }

    private sealed class TransactionPayload
    {
        [JsonPropertyName("transaction_id")]
        public string? TransactionId { get; set; }

        public string? Timestamp { get; set; }

        public decimal Amount { get; set; }

        public string? Currency { get; set; }

        public string? Description { get; set; }
    }
}
