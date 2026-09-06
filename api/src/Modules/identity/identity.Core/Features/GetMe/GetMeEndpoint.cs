using identity.Contracts;
using identity.Core.Examples;
using identity.Core.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;
using System.Security.Claims;

namespace identity.Core.Features.GetMe;

internal static class GetMeEndpoint
{
    internal static IEndpointRouteBuilder MapGetMeEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/identity/me", async (
            ClaimsPrincipal user,
            GetMeHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var profile = await handler.HandleAsync(new GetMeQuery(userId), ct);
            return profile is null ? Results.NotFound() : Results.Ok(profile);
        })
        .RequireAuthorization()
        .WithName("GetMe")
        .WithTags("identity")
        .Produces<MeProfileDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(MeProfileExample)));

        return app;
    }
}
