using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class SignInResponseExample : IExamplesProvider<SignInResponse>
{
    public SignInResponse GetExamples() => new(
        UserId: Guid.Parse("11111111-1111-1111-1111-111111111111"),
        AccessToken: "stub-access-token");
}