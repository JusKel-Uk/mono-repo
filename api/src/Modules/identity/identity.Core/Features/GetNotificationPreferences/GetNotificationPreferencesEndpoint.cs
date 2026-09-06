using identity.Contracts;
using identity.Core.Examples;
using identity.Core.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;
using System.Security.Claims;

namespace identity.Core.Features.GetNotificationPreferences;

internal static class GetNotificationPreferencesEndpoint
{
    internal static IEndpointRouteBuilder MapGetNotificationPreferencesEndpoint(
        this IEndpointRouteBuilder app)
    {
        app.MapGet("/identity/me/notification-preferences", async (
            ClaimsPrincipal user,
            GetNotificationPreferencesHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var prefs = await handler.HandleAsync(new GetNotificationPreferencesQuery(userId), ct);
            return Results.Ok(prefs);
        })
        .RequireAuthorization()
        .WithName("GetNotificationPreferences")
        .WithTags("identity")
        .Produces<NotificationPreferencesDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(NotificationPreferencesExample)));

        return app;
    }
}
