using identity.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using notifications.Contracts;
using notifications.Core.Examples;
using notifications.Core.Features.GetInbox;
using notifications.Core.Features.GetUnreadCount;
using notifications.Core.Features.MarkAllRead;
using notifications.Core.Features.MarkRead;
using Swashbuckle.AspNetCore.Filters;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace notifications.Core;

public static class NotificationEndpoints
{
    public static WebApplication MapNotificationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/notifications")
            .RequireAuthorization()
            .WithTags("notifications");

        group.MapGet(string.Empty, async (
            ClaimsPrincipal user,
            HttpRequest request,
            IIdentityModule identity,
            GetInboxHandler handler,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            var response = await handler.HandleAsync(new GetInboxQuery(userId, access!.OrganisationId), ct);
            return Results.Ok(response);
        })
        .WithName("GetInbox")
        .Produces<InboxListResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(InboxListResponseExample)));

        group.MapGet("/unread-count", async (
            ClaimsPrincipal user,
            HttpRequest request,
            IIdentityModule identity,
            GetUnreadCountHandler handler,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            var response = await handler.HandleAsync(new GetUnreadCountQuery(userId, access!.OrganisationId), ct);
            return Results.Ok(response);
        })
        .WithName("GetUnreadCount")
        .Produces<UnreadCountResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(UnreadCountResponseExample)));

        group.MapPost("/{id:guid}/read", async (
            Guid id,
            ClaimsPrincipal user,
            HttpRequest request,
            IIdentityModule identity,
            MarkReadHandler handler,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            var found = await handler.HandleAsync(
                new MarkReadCommand(userId, access!.OrganisationId, id),
                ct);
            return found ? Results.NoContent() : Results.NotFound();
        })
        .WithName("MarkNotificationRead")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapPost("/read-all", async (
            ClaimsPrincipal user,
            HttpRequest request,
            IIdentityModule identity,
            MarkAllReadHandler handler,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            await handler.HandleAsync(new MarkAllReadCommand(userId, access!.OrganisationId), ct);
            return Results.NoContent();
        })
        .WithName("MarkAllNotificationsRead")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapGet("/me/preferences", async (
            ClaimsPrincipal user,
            IIdentityModule identity,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var prefs = await identity.GetNotificationPreferencesAsync(userId, ct);
            return Results.Ok(prefs);
        })
        .WithName("GetNotificationModulePreferences")
        .Produces<NotificationPreferencesDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(NotificationPreferencesExample)));

        group.MapPut("/me/preferences", async (
            NotificationPreferencesDto request,
            ClaimsPrincipal user,
            IIdentityModule identity,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var prefs = await identity.PutNotificationPreferencesAsync(userId, request, ct);
            return prefs is null ? Results.NotFound() : Results.Ok(prefs);
        })
        .WithName("PutNotificationModulePreferences")
        .Accepts<NotificationPreferencesDto>("application/json")
        .Produces<NotificationPreferencesDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(
            typeof(NotificationPreferencesDto),
            typeof(NotificationPreferencesExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(NotificationPreferencesExample)));

        return app;
    }

    private static bool TryGetUserId(ClaimsPrincipal user, out Guid userId)
    {
        var userIdValue = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(userIdValue, out userId);
    }
}
