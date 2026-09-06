using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class PasswordResetConfirmRequestExample
    : IExamplesProvider<PasswordResetConfirmRequest>
{
    public PasswordResetConfirmRequest GetExamples() => new(
        "a1b2c3d4e5f64789a1b2c3d4e5f64789.dGhpcy1pcy1hLXNhbXBsZS10b2tlbg",
        "N3wP@ssw0rd!");
}
