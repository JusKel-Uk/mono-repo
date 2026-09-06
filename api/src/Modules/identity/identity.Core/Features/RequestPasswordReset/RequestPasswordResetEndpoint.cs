using identity.Contracts;
using identity.Core.Examples;
using identity.Core.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;
using System.Security.Claims;

namespace identity.Core.Features.RequestPasswordReset;

internal static class RequestPasswordResetEndpoint
{
    internal static IEndpointRouteBuilder MapRequestPasswordResetEndpoint(
        this IEndpointRouteBuilder app)
    {
        app.MapPost("/identity/password-reset", async (
            PasswordResetEmailRequest request,
            RequestPasswordResetHandler handler,
            CancellationToken ct) =>
        {
            var response = await handler.HandleAsync(
                new RequestPasswordResetCommand(request.Email, null),
                ct);
            return Results.Ok(response);
        })
        .WithName("RequestPasswordReset")
        .WithTags("identity")
        .Accepts<PasswordResetEmailRequest>("application/json")
        .Produces<PasswordResetAcceptedResponse>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(
            typeof(PasswordResetEmailRequest),
            typeof(PasswordResetEmailRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(PasswordResetAcceptedResponseExample)));

        app.MapPost("/identity/me/password-reset", async (
            ClaimsPrincipal user,
            RequestPasswordResetHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await handler.HandleAsync(
                new RequestPasswordResetCommand(null, userId),
                ct);
            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("RequestMyPasswordReset")
        .WithTags("identity")
        .Produces<PasswordResetAcceptedResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(PasswordResetAcceptedResponseExample)));

        return app;
    }
}
