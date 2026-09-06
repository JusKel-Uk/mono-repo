using identity.Contracts;
using identity.Core.Examples;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Features.ConfirmPasswordReset;

internal static class ConfirmPasswordResetEndpoint
{
    internal static IEndpointRouteBuilder MapConfirmPasswordResetEndpoint(
        this IEndpointRouteBuilder app)
    {
        app.MapPost("/identity/password-reset/confirm", async (
            PasswordResetConfirmRequest request,
            ConfirmPasswordResetHandler handler,
            CancellationToken ct) =>
        {
            await handler.HandleAsync(request, ct);
            return Results.NoContent();
        })
        .WithName("ConfirmPasswordReset")
        .WithTags("identity")
        .Accepts<PasswordResetConfirmRequest>("application/json")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(
            typeof(PasswordResetConfirmRequest),
            typeof(PasswordResetConfirmRequestExample)));

        return app;
    }
}
