using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class PasswordResetEmailRequestExample : IExamplesProvider<PasswordResetEmailRequest>
{
    public PasswordResetEmailRequest GetExamples() => new("ada@example.com");
}
