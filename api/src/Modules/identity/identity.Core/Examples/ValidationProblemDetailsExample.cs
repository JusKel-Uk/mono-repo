using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Filters;
using Microsoft.AspNetCore.Http;

namespace identity.Core.Examples;

public sealed class ValidationProblemDetailsExample : IExamplesProvider<ProblemDetails>
{
    public ProblemDetails GetExamples() => new()
    {
        Status = StatusCodes.Status400BadRequest,
        Title = "Validation failed.",
        Detail = "Email is required."
    };
}