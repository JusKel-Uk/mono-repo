using System.Net.Http.Headers;
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
            ["scope"] = "info accounts balance",
            ["state"] = state,
            ["providers"] = "uk-ob-all uk-oauth-all",
        };

        var url = $"{_options.AuthBaseUrl.TrimEnd('/')}/?{string.Join("&", query.Select(static kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"))}";
        return new OpenBankingAuthorizationResult(url, state);
    }

    public async Task<OpenBankingTokenResult> ExchangeCodeAsync(string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId) || string.IsNullOrWhiteSpace(_options.ClientSecret))
        {
            return new OpenBankingTokenResult(
                $"stub-access-token-{Guid.NewGuid():N}",
                $"stub-refresh-token-{Guid.NewGuid():N}",
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

        response.EnsureSuccessStatusCode();
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
        if (accessToken.StartsWith("stub-access-token", StringComparison.Ordinal))
        {
            return
            [
                new OpenBankingAccountSummary("stub-account-1", "Business Current", 125_000.00m, "GBP"),
            ];
        }

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{_options.ApiBaseUrl.TrimEnd('/')}/data/v1/accounts");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<AccountsPayload>(stream, JsonOptions, ct);
        if (payload?.Results is null)
            return [];

        return payload.Results
            .Select(static account => new OpenBankingAccountSummary(
                account.AccountId ?? Guid.NewGuid().ToString(),
                account.DisplayName ?? "Account",
                account.Balance?.Current ?? 0m,
                account.Currency ?? "GBP"))
            .ToList();
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
        public string? AccountId { get; set; }

        public string? DisplayName { get; set; }

        public string? Currency { get; set; }

        public BalancePayload? Balance { get; set; }
    }

    private sealed class BalancePayload
    {
        public decimal Current { get; set; }
    }
}
