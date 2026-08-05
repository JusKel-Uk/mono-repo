using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class SignInRequestExample : IExamplesProvider<SignInRequest>
{
    public SignInRequest GetExamples() => new(
        Email: "user@example.com",
        Password: "P@ssw0rd!");
}