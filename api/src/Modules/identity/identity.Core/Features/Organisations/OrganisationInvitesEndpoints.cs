using identity.Contracts;
using identity.Core.Examples;
using identity.Core.Http;
using juskel.Shared.Organisation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;
using System.Security.Claims;

namespace identity.Core.Features.Organisations;

internal static partial class OrganisationsEndpoints
{
    private static void MapInviteListAndResend(IEndpointRouteBuilder app)
    {
        app.MapPost("/identity/invites/preview", async (
            PreviewOrganisationInviteRequest request,
            PreviewOrganisationInviteHandler handler,
            CancellationToken ct) =>
        {
            var preview = await handler.HandleAsync(request, ct);
            return preview is null ? Results.NotFound() : Results.Ok(preview);
        })
        .AllowAnonymous()
        .RequireRateLimiting("invite-preview")
        .WithName("PreviewOrganisationInvite")
        .WithTags("identity-organisations")
        .Accepts<PreviewOrganisationInviteRequest>("application/json")
        .Produces<PreviewOrganisationInviteResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status429TooManyRequests)
        .WithMetadata(new SwaggerRequestExampleAttribute(
            typeof(PreviewOrganisationInviteRequest),
            typeof(PreviewOrganisationInviteRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(PreviewOrganisationInviteResponseExample)));

        app.MapGet("/identity/organisations/{organisationId:guid}/invites", async (
            ClaimsPrincipal user,
            Guid organisationId,
            HttpRequest httpRequest,
            IIdentityModule identity,
            ListOrganisationInvitesHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var resolution = await identity.ResolveOrganisationAccessAsync(
                userId,
                OrganisationHttpExtensions.TryGetRequestedOrganisationId(httpRequest) ?? organisationId,
                ct);

            if (resolution.Status != OrganisationResolutionStatus.Success)
                return MapResolutionError(resolution.Status);

            if (resolution.Access!.OrganisationId != organisationId)
                return OrganisationApiResults.Forbidden();

            if (!resolution.Access.CanManageTeam)
                return OrganisationApiResults.Forbidden();

            var invites = await handler.HandleAsync(userId, organisationId, ct);
            return invites is null ? Results.NotFound() : Results.Ok(invites);
        })
        .RequireAuthorization()
        .WithName("ListOrganisationInvites")
        .WithTags("identity-organisations")
        .Produces<IReadOnlyList<OrganisationInviteDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ProblemDetails>(StatusCodes.Status403Forbidden)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(OrganisationInviteListExample)));

        app.MapPost("/identity/organisations/{organisationId:guid}/invites/{inviteId:guid}/resend", async (
            ClaimsPrincipal user,
            Guid organisationId,
            Guid inviteId,
            HttpRequest httpRequest,
            IIdentityModule identity,
            ResendOrganisationInviteHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var resolution = await identity.ResolveOrganisationAccessAsync(
                userId,
                OrganisationHttpExtensions.TryGetRequestedOrganisationId(httpRequest) ?? organisationId,
                ct);

            if (resolution.Status != OrganisationResolutionStatus.Success)
                return MapResolutionError(resolution.Status);

            if (resolution.Access!.OrganisationId != organisationId)
                return OrganisationApiResults.Forbidden();

            if (!resolution.Access.CanManageTeam)
                return OrganisationApiResults.Forbidden();

            var response = await handler.HandleAsync(userId, organisationId, inviteId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("ResendOrganisationInvite")
        .WithTags("identity-organisations")
        .Produces<CreateOrganisationInviteResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ProblemDetails>(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(CreateOrganisationInviteResponseExample)));
    }
}
