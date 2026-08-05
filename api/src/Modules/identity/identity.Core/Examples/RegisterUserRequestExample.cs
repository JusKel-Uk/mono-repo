using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class RegisterUserRequestExample : IExamplesProvider<RegisterUserRequest>
{
    public RegisterUserRequest GetExamples() => new(
        FirstName: "Ada",
        LastName: "Lovelace",
        Email: "ada@example.com",
        Password: "P@ssw0rd!");
}