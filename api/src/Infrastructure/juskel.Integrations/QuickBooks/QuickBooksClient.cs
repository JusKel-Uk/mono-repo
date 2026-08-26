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
        if (string.IsNullOrWhiteSpace(_options.ClientId) || string.IsNullOrWhiteSpace(_options.ClientSecret))
        {
            return new OAuthTokenResult(
                $"stub-qb-access-{Guid.NewGuid():N}",
                $"stub-qb-refresh-{Guid.NewGuid():N}",
                DateTime.UtcNow.AddMinutes(60));
        }

        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = _options.RedirectUri,
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, _options.TokenUrl)
        {
            Content = content,
        };
        var credentials = Convert.ToBase64String(
            System.Text.Encoding.UTF8.GetBytes($"{_options.ClientId}:{_options.ClientSecret}"));
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);

        using var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<TokenPayload>(stream, JsonOptions, ct)
            ?? throw new InvalidOperationException("QuickBooks token response was empty.");

        var expiresAt = payload.ExpiresIn > 0
            ? DateTime.UtcNow.AddSeconds(payload.ExpiresIn)
            : (DateTime?)null;

        return new OAuthTokenResult(payload.AccessToken, payload.RefreshToken, expiresAt);
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
}
