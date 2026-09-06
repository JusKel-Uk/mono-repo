using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class PasswordResetAcceptedResponseExample
    : IExamplesProvider<PasswordResetAcceptedResponse>
{
    public PasswordResetAcceptedResponse GetExamples() => new(
        "If an account exists for this email, a password reset code has been sent.");
}
