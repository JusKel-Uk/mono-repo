using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class UserSummaryExample : IExamplesProvider<UserSummaryDto>
{
    public UserSummaryDto GetExamples() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        "hello@example.com");
}