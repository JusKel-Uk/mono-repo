using juskel.Api.Contracts.Responses;
using Swashbuckle.AspNetCore.Filters;

namespace juskel.Api.Contracts.Examples;

public sealed class LookupsResponseExample : IExamplesProvider<LookupsResponse>
{
    public LookupsResponse GetExamples() => SampleLookups.All();
}

public sealed class OnboardingLookupsResponseExample : IExamplesProvider<LookupsResponse>
{
    public LookupsResponse GetExamples() => SampleLookups.Onboarding();
}

public sealed class FundingLookupsResponseExample : IExamplesProvider<LookupsResponse>
{
    public LookupsResponse GetExamples() => SampleLookups.Funding();
}

public sealed class ScoringLookupsResponseExample : IExamplesProvider<LookupsResponse>
{
    public LookupsResponse GetExamples() => SampleLookups.Scoring();
}

internal static class SampleLookups
{
    private static readonly IReadOnlyDictionary<string, IReadOnlyList<LookupOptionDto>> Catalog =
        new Dictionary<string, IReadOnlyList<LookupOptionDto>>
        {
            ["companyRelationship"] =
            [
                new(1, "Sole trader"),
                new(2, "Director"),
            ],
            ["ukRegion"] =
            [
                new(1, "England"),
                new(2, "Wales"),
            ],
            ["employeeSizeBand"] =
            [
                new(2, "10–49 employees"),
            ],
            ["annualTurnoverBand"] =
            [
                new(2, "£250k – £1m"),
            ],
            ["yearsInOperationBand"] =
            [
                new(3, "3–5 years"),
            ],
            ["businessSector"] =
            [
                new(1, "Technology"),
                new(99, "Other"),
            ],
            ["revenueBand"] =
            [
                new(2, "£100k – £500k"),
            ],
            ["ebitdaBand"] =
            [
                new(3, "£50k – £250k"),
            ],
            ["debtBand"] =
            [
                new(1, "None"),
            ],
            ["cashReservesBand"] =
            [
                new(3, "£50k – £250k"),
            ],
            ["monthlyRevenueBand"] =
            [
                new(3, "£50k – £100k"),
            ],
            ["fundingPurpose"] =
            [
                new(1, "Working capital"),
            ],
            ["fundingUrgency"] =
            [
                new(2, "Within 30 days"),
            ],
            ["sustainabilityAnswer"] =
            [
                new(1, "Yes"),
                new(2, "No"),
            ],
        };

    public static LookupsResponse All() => new(Catalog);

    public static LookupsResponse Onboarding() => new(new Dictionary<string, IReadOnlyList<LookupOptionDto>>
    {
        ["companyRelationship"] = Catalog["companyRelationship"],
        ["ukRegion"] = Catalog["ukRegion"],
        ["employeeSizeBand"] = Catalog["employeeSizeBand"],
        ["annualTurnoverBand"] = Catalog["annualTurnoverBand"],
        ["yearsInOperationBand"] = Catalog["yearsInOperationBand"],
        ["businessSector"] = Catalog["businessSector"],
    });

    public static LookupsResponse Funding() => new(new Dictionary<string, IReadOnlyList<LookupOptionDto>>
    {
        ["revenueBand"] = Catalog["revenueBand"],
        ["ebitdaBand"] = Catalog["ebitdaBand"],
        ["debtBand"] = Catalog["debtBand"],
        ["cashReservesBand"] = Catalog["cashReservesBand"],
        ["monthlyRevenueBand"] = Catalog["monthlyRevenueBand"],
        ["fundingPurpose"] = Catalog["fundingPurpose"],
        ["fundingUrgency"] = Catalog["fundingUrgency"],
    });

    public static LookupsResponse Scoring() => new(new Dictionary<string, IReadOnlyList<LookupOptionDto>>
    {
        ["sustainabilityAnswer"] = Catalog["sustainabilityAnswer"],
    });
}
