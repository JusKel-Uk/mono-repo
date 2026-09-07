using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace juskel.Shared.Organisation;

public static class OrganisationApiResults
{
    public static IResult ContextRequired(string? detail = null) =>
        Results.BadRequest(new ProblemDetails
        {
            Title = "Organisation context required",
            Detail = detail ??
                     "Provide the X-Organisation-Id header or set your current organisation.",
            Status = StatusCodes.Status400BadRequest,
            Type = "organisation-context-required",
        });

    public static IResult Forbidden(string? detail = null) =>
        Results.Json(
            new ProblemDetails
            {
                Title = "Forbidden",
                Detail = detail ?? "You do not have access to this organisation.",
                Status = StatusCodes.Status403Forbidden,
            },
            statusCode: StatusCodes.Status403Forbidden);

    public static IResult OrganisationClosed(string? detail = null) =>
        Results.Json(
            new ProblemDetails
            {
                Title = "Organisation closed",
                Detail = detail ?? "This organisation has been closed.",
                Status = StatusCodes.Status403Forbidden,
                Type = "organisation-closed",
            },
            statusCode: StatusCodes.Status403Forbidden);
}
