using identity.Core.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace identity.Core.Features.RevokeCurrentSession;

internal static class RevokeCurrentSessionEndpoint
{
    internal static IEndpointRouteBuilder MapRevokeCurrentSessionEndpoint(
        this IEndpointRouteBuilder app)
    {
        app.MapDelete("/identity/me/sessions/current", async (
            ClaimsPrincipal user,
            RevokeCurrentSessionHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId)
                || !IdentityHttpUser.TryGetJti(user, out var jti))
            {
                return Results.Unauthorized();
            }

            await handler.HandleAsync(userId, jti, ct);
            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("RevokeCurrentSession")
        .WithTags("identity")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        return app;
    }
}
