using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class VerifyEmailResponseExample : IExamplesProvider<VerifyEmailResponse>
{
    public VerifyEmailResponse GetExamples() => new(
        UserId: Guid.Parse("11111111-1111-1111-1111-111111111111"),
        Email: "ada@example.com",
        EmailVerified: true);
}