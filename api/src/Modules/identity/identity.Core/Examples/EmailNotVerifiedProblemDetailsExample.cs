using identity.Contracts;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class EmailNotVerifiedProblemDetailsExample : IExamplesProvider<ProblemDetails>
{
    public ProblemDetails GetExamples() => new()
    {
        Type = "https://juskel.com/problems/email-not-verified",
        Status = StatusCodes.Status403Forbidden,
        Title = "Email not verified.",
        Detail = "Email address is not verified. Check your inbox for the verification code.",
        Extensions =
        {
            ["errorCode"] = IdentityErrorCodes.EmailNotVerified,
            ["email"] = "ada@example.com"
        }
    };
}
