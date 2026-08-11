using juskel.Api.Contracts.Responses;
using Swashbuckle.AspNetCore.Filters;

namespace juskel.Api.Contracts.Examples;

public sealed class RootResponseExample : IExamplesProvider<RootResponse>
{
    public RootResponse GetExamples() => new("online", "1.0.0");
}