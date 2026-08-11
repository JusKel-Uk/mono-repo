using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using identity.Contracts;
using identity.Core.Examples;
using identity.Core.Features.GetUserById;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Features.GetMe;

internal static class GetMeEndpoint
{
    internal static IEndpointRouteBuilder MapGetMeEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/identity/me", async (
            ClaimsPrincipal user,
            GetUserByIdHandler handler,
            CancellationToken ct) =>
        {
            var userIdValue = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
                return Results.Unauthorized();

            var summary = await handler.HandleAsync(new GetUserByIdQuery(userId), ct);
            return summary is null ? Results.NotFound() : Results.Ok(summary);
        })
        .RequireAuthorization()
        .WithName("GetMe")
        .WithTags("identity")
        .Produces<UserSummaryDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(UserSummaryExample)));

        return app;
    }
}