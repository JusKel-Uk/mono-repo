using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class ResendOtpRequestExample : IExamplesProvider<ResendOtpRequest>
{
    public ResendOtpRequest GetExamples() => new(Email: "ada@example.com");
}
