using identity.Core.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace identity.Core.Features.RevokeSession;

internal static class RevokeSessionEndpoint
{
    internal static IEndpointRouteBuilder MapRevokeSessionEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/identity/me/sessions/{id:guid}", async (
            Guid id,
            ClaimsPrincipal user,
            RevokeSessionHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var found = await handler.HandleAsync(userId, id, ct);
            return found ? Results.NoContent() : Results.NotFound();
        })
        .RequireAuthorization()
        .WithName("RevokeMySession")
        .WithTags("identity")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        return app;
    }
}
