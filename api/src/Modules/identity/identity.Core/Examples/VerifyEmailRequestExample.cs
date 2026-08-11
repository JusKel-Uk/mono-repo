using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class VerifyEmailRequestExample : IExamplesProvider<VerifyEmailRequest>
{
    public VerifyEmailRequest GetExamples() => new(
        Email: "ada@example.com",
        OtpCode: "482 917");
}