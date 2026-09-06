using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class AccountClosureResponseExample : IExamplesProvider<AccountClosureResponse>
{
    public AccountClosureResponse GetExamples() => new(
        "requested",
        DateTime.Parse("2026-09-06T18:30:00Z").ToUniversalTime());
}
