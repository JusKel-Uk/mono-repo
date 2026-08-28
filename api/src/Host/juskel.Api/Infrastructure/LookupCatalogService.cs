using System.Text.Json;
using juskel.Api.Contracts.Responses;

namespace juskel.Api.Infrastructure;

// Loads api/onboarding-lookups.json (copied to Data/ at build). Each "value" must match
// the corresponding *Enums.cs member — never reuse or renumber values after release.

public interface ILookupCatalog
{
    LookupsResponse GetAll();

    LookupsResponse GetOnboarding();

    LookupsResponse GetFunding();

    LookupsResponse GetScoring();
}

public sealed class LookupCatalogService : ILookupCatalog
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private static readonly string[] OnboardingKeys =
    [
        "companyRelationship",
        "ukRegion",
        "employeeSizeBand",
        "annualTurnoverBand",
        "yearsInOperationBand",
        "businessSector",
    ];

    private static readonly string[] FundingKeys =
    [
        "revenueBand",
        "ebitdaBand",
        "debtBand",
        "cashReservesBand",
        "monthlyRevenueBand",
        "fundingPurpose",
        "fundingUrgency",
    ];

    private static readonly string[] ScoringKeys = ["sustainabilityAnswer"];

    private readonly IReadOnlyDictionary<string, IReadOnlyList<LookupOptionDto>> _all;

    public LookupCatalogService(IHostEnvironment environment)
    {
        var path = ResolveCatalogPath(environment);
        if (!File.Exists(path))
            throw new FileNotFoundException("Lookup catalog file not found.", path);

        var json = File.ReadAllText(path);
        var parsed = JsonSerializer.Deserialize<Dictionary<string, List<LookupOptionDto>>>(json, JsonOptions)
            ?? throw new InvalidOperationException("Lookup catalog file is empty or invalid.");

        _all = parsed.ToDictionary(
            static pair => pair.Key,
            static pair => (IReadOnlyList<LookupOptionDto>)pair.Value);
    }

    private static string ResolveCatalogPath(IHostEnvironment environment)
    {
        var relative = Path.Combine("Data", "onboarding-lookups.json");
        var fromOutput = Path.Combine(AppContext.BaseDirectory, relative);
        if (File.Exists(fromOutput))
            return fromOutput;

        return Path.Combine(environment.ContentRootPath, relative);
    }

    public LookupsResponse GetAll() => new(_all);

    public LookupsResponse GetOnboarding() => Slice(OnboardingKeys);

    public LookupsResponse GetFunding() => Slice(FundingKeys);

    public LookupsResponse GetScoring() => Slice(ScoringKeys);

    private LookupsResponse Slice(IEnumerable<string> keys)
    {
        var options = keys.ToDictionary(
            static key => key,
            key => _all.TryGetValue(key, out var values)
                ? values
                : throw new InvalidOperationException($"Missing lookup key '{key}' in catalog."));

        return new LookupsResponse(options);
    }
}
