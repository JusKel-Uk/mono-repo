using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Filters;

namespace juskel.Api.Contracts.Examples;

public sealed class ProblemDetailsExample : IExamplesProvider<ProblemDetails>
{
    public ProblemDetails GetExamples() => new()
    {
        Status = StatusCodes.Status500InternalServerError,
        Title="An error occured while processing your request",
        Detail="Example Error message",
    };
}