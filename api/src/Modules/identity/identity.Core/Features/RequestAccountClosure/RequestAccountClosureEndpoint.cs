using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace identity.Core.Features.RequestAccountClosure;

internal static class RequestAccountClosureEndpoint
{
    internal static IEndpointRouteBuilder MapRequestAccountClosureEndpoint(
        this IEndpointRouteBuilder app)
    {
        app.MapPost("/identity/me/account-closure", () =>
            Results.Json(
                new ProblemDetails
                {
                    Title = "Endpoint removed",
                    Detail = "Use POST /identity/organisations/{organisationId}/closure instead.",
                    Status = StatusCodes.Status410Gone,
                    Type = "account-closure-deprecated",
                },
                statusCode: StatusCodes.Status410Gone))
        .RequireAuthorization()
        .WithName("RequestAccountClosure")
        .WithTags("identity")
        .Produces<ProblemDetails>(StatusCodes.Status410Gone);

        return app;
    }
}
