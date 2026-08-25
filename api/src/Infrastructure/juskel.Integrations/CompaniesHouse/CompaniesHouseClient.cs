using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace juskel.Integrations.CompaniesHouse;

public sealed class CompaniesHouseClient : ICompaniesHouseClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    private readonly HttpClient _http;
    private readonly CompaniesHouseOptions _options;

    public CompaniesHouseClient(HttpClient http, IOptions<CompaniesHouseOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public async Task<CompanyLookupResult?> LookupCompanyAsync(
        string companyNumber,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            return null;

        var normalized = companyNumber.Trim().ToUpperInvariant();
        var requestUri = $"{_options.BaseUrl.TrimEnd('/')}/company/{normalized}";

        using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.ApiKey}:"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        using var response = await _http.SendAsync(request, ct);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            return null;

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<CompaniesHouseApiResponse>(stream, JsonOptions, ct);

        if (payload is null || string.IsNullOrWhiteSpace(payload.CompanyName))
            return null;

        var address = payload.RegisteredOfficeAddress is null
            ? null
            : string.Join(", ", new[]
            {
                payload.RegisteredOfficeAddress.AddressLine1,
                payload.RegisteredOfficeAddress.Locality,
                payload.RegisteredOfficeAddress.PostalCode,
            }.Where(static s => !string.IsNullOrWhiteSpace(s)));

        var isActive = string.Equals(payload.CompanyStatus, "active", StringComparison.OrdinalIgnoreCase);

        return new CompanyLookupResult(
            normalized,
            payload.CompanyName,
            payload.CompanyStatus ?? "unknown",
            address,
            isActive);
    }

    private sealed class CompaniesHouseApiResponse
    {
        public string? CompanyName { get; set; }

        public string? CompanyStatus { get; set; }

        public RegisteredOfficeAddressPayload? RegisteredOfficeAddress { get; set; }
    }

    private sealed class RegisteredOfficeAddressPayload
    {
        public string? AddressLine1 { get; set; }

        public string? Locality { get; set; }

        public string? PostalCode { get; set; }
    }
}
