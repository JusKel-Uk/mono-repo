namespace juskel.Api.Contracts.Responses;

public sealed record LookupsResponse(
    IReadOnlyDictionary<string, IReadOnlyList<LookupOptionDto>> Options);
