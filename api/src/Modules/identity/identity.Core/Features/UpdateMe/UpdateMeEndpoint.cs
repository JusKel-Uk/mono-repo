using identity.Contracts;
using identity.Core.Examples;
using identity.Core.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;
using System.Security.Claims;

namespace identity.Core.Features.UpdateMe;

internal static class UpdateMeEndpoint
{
    internal static IEndpointRouteBuilder MapUpdateMeEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/identity/me", async (
            UpdateMeRequest request,
            ClaimsPrincipal user,
            UpdateMeHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var command = new UpdateMeCommand(
                userId,
                request.FirstName,
                request.LastName,
                request.JobTitle,
                request.Phone);

            var profile = await handler.HandleAsync(command, ct);
            return profile is null ? Results.NotFound() : Results.Ok(profile);
        })
        .RequireAuthorization()
        .WithName("UpdateMe")
        .WithTags("identity")
        .Accepts<UpdateMeRequest>("application/json")
        .Produces<MeProfileDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(UpdateMeRequest), typeof(UpdateMeRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(MeProfileExample)));

        return app;
    }
}
