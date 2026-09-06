using identity.Contracts;
using identity.Core.Examples;
using identity.Core.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;
using System.Security.Claims;

namespace identity.Core.Features.PutNotificationPreferences;

internal static class PutNotificationPreferencesEndpoint
{
    internal static IEndpointRouteBuilder MapPutNotificationPreferencesEndpoint(
        this IEndpointRouteBuilder app)
    {
        app.MapPut("/identity/me/notification-preferences", async (
            NotificationPreferencesDto request,
            ClaimsPrincipal user,
            PutNotificationPreferencesHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var prefs = await handler.HandleAsync(
                new PutNotificationPreferencesCommand(userId, request),
                ct);

            return prefs is null ? Results.NotFound() : Results.Ok(prefs);
        })
        .RequireAuthorization()
        .WithName("PutNotificationPreferences")
        .WithTags("identity")
        .Accepts<NotificationPreferencesDto>("application/json")
        .Produces<NotificationPreferencesDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(
            typeof(NotificationPreferencesDto),
            typeof(NotificationPreferencesExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(NotificationPreferencesExample)));

        return app;
    }
}
