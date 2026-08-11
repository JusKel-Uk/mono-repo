using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class ResendOtpResponseExample : IExamplesProvider<ResendOtpResponse>
{
    public ResendOtpResponse GetExamples() => new(
        Message: "If an unverified account exists for this email, a new verification code has been sent.");
}
