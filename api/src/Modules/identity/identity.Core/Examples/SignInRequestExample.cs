using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class SignInRequestExample : IExamplesProvider<SignInRequest>
{
    public SignInRequest GetExamples() => new(
        Email: "zpfkqn@riwutz-gmail.com",
        Password: "gamingRig1!!");
}
