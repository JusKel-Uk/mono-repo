using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace juskel.Integrations.QuickBooks;

public sealed class QuickBooksClient : IQuickBooksClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly HttpClient _http;
    private readonly QuickBooksOptions _options;

    public QuickBooksClient(HttpClient http, IOptions<QuickBooksOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public OAuthAuthorizationResult BuildAuthorizationUrl(Guid applicationId, Guid userId)
    {
        var state = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{applicationId}:{userId}:{Guid.NewGuid()}"));
        var query = new Dictionary<string, string>
        {
            ["client_id"] = _options.ClientId,
            ["response_type"] = "code",
            ["scope"] = "com.intuit.quickbooks.accounting",
            ["redirect_uri"] = _options.RedirectUri,
            ["state"] = state,
        };

        var url = $"{_options.AuthBaseUrl}?{string.Join("&", query.Select(static kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"))}";
        return new OAuthAuthorizationResult(url, state);
    }

    public async Task<OAuthTokenResult> ExchangeCodeAsync(string code, CancellationToken ct = default)
    {
        if (IsStubMode())
            return CreateStubToken();

        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = _options.RedirectUri,
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, _options.TokenUrl) { Content = content };
        request.Headers.Authorization = CreateBasicAuthHeader();

        using var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        return await ReadTokenPayloadAsync(response, ct);
    }

    public async Task<OAuthTokenResult> RefreshAccessTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        if (IsStubMode())
            return CreateStubToken();

        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = refreshToken,
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, _options.TokenUrl) { Content = content };
        request.Headers.Authorization = CreateBasicAuthHeader();

        using var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        return await ReadTokenPayloadAsync(response, ct);
    }

    public async Task<QuickBooksSyncResult> SyncFinancialDataAsync(
        string accessToken,
        string? refreshToken,
        string realmId,
        CancellationToken ct = default)
    {
        if (accessToken.StartsWith("stub-qb-access", StringComparison.Ordinal))
            return new QuickBooksSyncResult(CreateStubSnapshot(), null);

        OAuthTokenResult? refreshed = null;
        var token = accessToken;

        try
        {
            return new QuickBooksSyncResult(
                await FetchSnapshotAsync(token, realmId, ct),
                refreshed);
        }
        catch (QuickBooksUnauthorizedException) when (!string.IsNullOrWhiteSpace(refreshToken))
        {
            refreshed = await RefreshAccessTokenAsync(refreshToken, ct);
            token = refreshed.AccessToken;
            return new QuickBooksSyncResult(
                await FetchSnapshotAsync(token, realmId, ct),
                refreshed);
        }
    }

    private async Task<QuickBooksFinancialSnapshot> FetchSnapshotAsync(
        string accessToken,
        string realmId,
        CancellationToken ct)
    {
        var minor = Uri.EscapeDataString(_options.MinorVersion);
        var periodStart = DateOnly.Parse(_options.ReportStartDate, CultureInfo.InvariantCulture);
        var periodEnd = DateOnly.Parse(_options.ReportEndDate, CultureInfo.InvariantCulture);
        var priorStart = periodStart.AddYears(-1);
        var priorEnd = periodEnd.AddYears(-1);
        var start = Uri.EscapeDataString(periodStart.ToString("O", CultureInfo.InvariantCulture));
        var end = Uri.EscapeDataString(periodEnd.ToString("O", CultureInfo.InvariantCulture));
        var priorStartEncoded = Uri.EscapeDataString(priorStart.ToString("O", CultureInfo.InvariantCulture));
        var priorEndEncoded = Uri.EscapeDataString(priorEnd.ToString("O", CultureInfo.InvariantCulture));
        var asOf = Uri.EscapeDataString(periodEnd.ToString("O", CultureInfo.InvariantCulture));
        var baseUrl = _options.ApiBaseUrl.TrimEnd('/');

        var companyInfo = await GetJsonAsync(
            accessToken,
            $"{baseUrl}/{realmId}/companyinfo/{realmId}?minorversion={minor}",
            ct);

        var profitAndLoss = await GetJsonAsync(
            accessToken,
            $"{baseUrl}/{realmId}/reports/ProfitAndLoss?start_date={start}&end_date={end}&minorversion={minor}",
            ct);

        var profitAndLossPrior = await GetJsonAsync(
            accessToken,
            $"{baseUrl}/{realmId}/reports/ProfitAndLoss?start_date={priorStartEncoded}&end_date={priorEndEncoded}&minorversion={minor}",
            ct);

        var balanceSheet = await GetJsonAsync(
            accessToken,
            $"{baseUrl}/{realmId}/reports/BalanceSheet?date={asOf}&minorversion={minor}",
            ct);

        var agedReceivables = await GetJsonAsync(
            accessToken,
            $"{baseUrl}/{realmId}/reports/AgedReceivables?report_date={asOf}&minorversion={minor}",
            ct);

        var agedPayables = await GetJsonAsync(
            accessToken,
            $"{baseUrl}/{realmId}/reports/AgedPayables?report_date={asOf}&minorversion={minor}",
            ct);

        var cashFlow = await GetJsonAsync(
            accessToken,
            $"{baseUrl}/{realmId}/reports/CashFlow?start_date={start}&end_date={end}&minorversion={minor}",
            ct);

        var accounts = await FetchAllAccountsAsync(accessToken, realmId, minor, baseUrl, ct);

        return QuickBooksFinancialSnapshotParser.Parse(
            companyInfo,
            profitAndLoss,
            profitAndLossPrior,
            balanceSheet,
            agedReceivables,
            agedPayables,
            cashFlow,
            accounts,
            periodStart,
            periodEnd,
            priorEnd,
            periodEnd);
    }

    private async Task<List<QuickBooksAccountSummary>> FetchAllAccountsAsync(
        string accessToken,
        string realmId,
        string minor,
        string baseUrl,
        CancellationToken ct)
    {
        var accounts = new List<QuickBooksAccountSummary>();
        var start = 1;

        while (start <= 5000)
        {
            var query = Uri.EscapeDataString($"select * from Account startposition {start} maxresults 100");
            using var document = await GetJsonAsync(
                accessToken,
                $"{baseUrl}/{realmId}/query?query={query}&minorversion={minor}",
                ct);

            if (!document.RootElement.TryGetProperty("QueryResponse", out var queryResponse)
                || !queryResponse.TryGetProperty("Account", out var accountArray))
            {
                break;
            }

            var batch = accountArray.EnumerateArray().ToList();
            if (batch.Count == 0)
                break;

            foreach (var account in batch)
            {
                accounts.Add(new QuickBooksAccountSummary(
                    account.TryGetProperty("AccountType", out var typeEl) ? typeEl.GetString() : null,
                    account.TryGetProperty("AccountSubType", out var subtypeEl) ? subtypeEl.GetString() : null,
                    account.TryGetProperty("Classification", out var classEl) ? classEl.GetString() : null,
                    account.TryGetProperty("CurrentBalance", out var balanceEl) ? balanceEl.GetDecimal() : 0m));
            }

            if (batch.Count < 100)
                break;

            start += 100;
        }

        return accounts;
    }

    private async Task<JsonDocument> GetJsonAsync(string accessToken, string url, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using var response = await _http.SendAsync(request, ct);
        if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
            throw new QuickBooksUnauthorizedException();

        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        return await JsonDocument.ParseAsync(stream, cancellationToken: ct);
    }

    private AuthenticationHeaderValue CreateBasicAuthHeader()
    {
        var credentials = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{_options.ClientId}:{_options.ClientSecret}"));
        return new AuthenticationHeaderValue("Basic", credentials);
    }

    private async Task<OAuthTokenResult> ReadTokenPayloadAsync(HttpResponseMessage response, CancellationToken ct)
    {
        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<TokenPayload>(stream, JsonOptions, ct)
            ?? throw new InvalidOperationException("QuickBooks token response was empty.");

        var expiresAt = payload.ExpiresIn > 0
            ? DateTime.UtcNow.AddSeconds(payload.ExpiresIn)
            : (DateTime?)null;

        return new OAuthTokenResult(payload.AccessToken, payload.RefreshToken, expiresAt);
    }

    private bool IsStubMode() =>
        string.IsNullOrWhiteSpace(_options.ClientId) || string.IsNullOrWhiteSpace(_options.ClientSecret);

    private static OAuthTokenResult CreateStubToken() =>
        new(
            $"stub-qb-access-{Guid.NewGuid():N}",
            $"stub-qb-refresh-{Guid.NewGuid():N}",
            DateTime.UtcNow.AddMinutes(60));

    private static QuickBooksFinancialSnapshot CreateStubSnapshot()
    {
        var periodEnd = DateOnly.FromDateTime(DateTime.UtcNow);
        var periodStart = new DateOnly(periodEnd.Year, 1, 1);
        const decimal revenue = 750_000m;
        const decimal netIncome = 95_000m;
        const decimal cash = 12_500m;
        const decimal liabilities = 45_000m;
        const decimal assets = 320_000m;
        const decimal currentAssets = 180_000m;
        const decimal currentLiabilities = 60_000m;

        return new QuickBooksFinancialSnapshot(
            "Stub QuickBooks Company",
            "GBP",
            true,
            true,
            periodStart,
            periodEnd,
            periodEnd.AddYears(-1),
            periodEnd,
            revenue,
            680_000m,
            180_000m,
            120_000m,
            netIncome,
            88_000m,
            110_000m,
            cash,
            42_000m,
            18_000m,
            currentAssets,
            currentLiabilities,
            currentAssets - currentLiabilities,
            assets,
            liabilities,
            assets - liabilities,
            35_000m,
            72_000m,
            currentAssets / currentLiabilities,
            liabilities / assets,
            netIncome / revenue,
            (revenue - 680_000m) / 680_000m,
            (netIncome - 88_000m) / 88_000m,
            24);
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

    private sealed class QuickBooksUnauthorizedException : Exception;
}
