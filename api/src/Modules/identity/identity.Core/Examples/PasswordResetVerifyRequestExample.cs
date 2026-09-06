using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class PasswordResetVerifyRequestExample : IExamplesProvider<PasswordResetVerifyRequest>
{
    public PasswordResetVerifyRequest GetExamples() => new("ada@example.com", "847291");
}
