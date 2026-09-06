using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class MeProfileExample : IExamplesProvider<MeProfileDto>
{
    public MeProfileDto GetExamples() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        "hello@example.com",
        "Ada",
        "Lovelace",
        "Founder & Managing Director",
        "+44 117 000 0000",
        null);
}
