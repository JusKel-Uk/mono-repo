using identity.Contracts;
using identity.Core.Examples;
using identity.Core.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;
using System.Security.Claims;

namespace identity.Core.Features.ListSessions;

internal static class ListSessionsEndpoint
{
    internal static IEndpointRouteBuilder MapListSessionsEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/identity/me/sessions", async (
            ClaimsPrincipal user,
            ListSessionsHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            IdentityHttpUser.TryGetJti(user, out var jti);
            var response = await handler.HandleAsync(new ListSessionsQuery(userId, jti), ct);
            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("ListMySessions")
        .WithTags("identity")
        .Produces<SessionListResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(SessionListResponseExample)));

        return app;
    }
}
