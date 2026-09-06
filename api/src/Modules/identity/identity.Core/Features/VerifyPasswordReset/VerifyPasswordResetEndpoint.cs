using identity.Contracts;
using identity.Core.Examples;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Features.VerifyPasswordReset;

internal static class VerifyPasswordResetEndpoint
{
    internal static IEndpointRouteBuilder MapVerifyPasswordResetEndpoint(
        this IEndpointRouteBuilder app)
    {
        app.MapPost("/identity/password-reset/verify", async (
            PasswordResetVerifyRequest request,
            VerifyPasswordResetHandler handler,
            CancellationToken ct) =>
        {
            var response = await handler.HandleAsync(request, ct);
            return Results.Ok(response);
        })
        .WithName("VerifyPasswordReset")
        .WithTags("identity")
        .Accepts<PasswordResetVerifyRequest>("application/json")
        .Produces<PasswordResetVerifyResponse>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(
            typeof(PasswordResetVerifyRequest),
            typeof(PasswordResetVerifyRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(PasswordResetVerifyResponseExample)));

        return app;
    }
}
