using identity.Contracts;
using identity.Core.Examples;
using identity.Core.Http;
using identity.Core.Features.Organisations;
using juskel.Shared.Organisation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;
using System.Security.Claims;

namespace identity.Core.Features.Organisations;

internal static class OrganisationsEndpoints
{
    internal static IEndpointRouteBuilder MapOrganisationsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/identity/me/organisations", async (
            ClaimsPrincipal user,
            ListOrganisationsHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var organisations = await handler.HandleAsync(userId, ct);
            return Results.Ok(organisations);
        })
        .RequireAuthorization()
        .WithName("ListMyOrganisations")
        .WithTags("identity-organisations")
        .Produces<IReadOnlyList<OrganisationSummaryDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(OrganisationSummaryListExample)));

        app.MapPut("/identity/me/organisations/current", async (
            ClaimsPrincipal user,
            SetCurrentOrganisationRequest request,
            SetCurrentOrganisationHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var organisation = await handler.HandleAsync(userId, request.OrganisationId, ct);
            return organisation is null ? Results.NotFound() : Results.Ok(organisation);
        })
        .RequireAuthorization()
        .WithName("SetCurrentOrganisation")
        .WithTags("identity-organisations")
        .Accepts<SetCurrentOrganisationRequest>("application/json")
        .Produces<OrganisationSummaryDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .WithMetadata(new SwaggerRequestExampleAttribute(
            typeof(SetCurrentOrganisationRequest),
            typeof(SetCurrentOrganisationRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(OrganisationSummaryExample)));

        app.MapGet("/identity/organisations/{organisationId:guid}/members", async (
            ClaimsPrincipal user,
            Guid organisationId,
            HttpRequest httpRequest,
            IIdentityModule identity,
            ListOrganisationMembersHandler handler,
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

            var members = await handler.HandleAsync(userId, organisationId, ct);
            return members is null ? Results.NotFound() : Results.Ok(members);
        })
        .RequireAuthorization()
        .WithName("ListOrganisationMembers")
        .WithTags("identity-organisations")
        .Produces<IReadOnlyList<OrganisationMemberDto>>(StatusCodes.Status200OK)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(OrganisationMemberListExample)));

        app.MapPost("/identity/organisations/{organisationId:guid}/invites", async (
            ClaimsPrincipal user,
            Guid organisationId,
            CreateOrganisationInviteRequest request,
            HttpRequest httpRequest,
            IIdentityModule identity,
            CreateOrganisationInviteHandler handler,
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

            if (!resolution.Access!.CanManageTeam)
                return OrganisationApiResults.Forbidden();

            try
            {
                var response = await handler.HandleAsync(userId, organisationId, request, ct);
                return response is null ? Results.NotFound() : Results.Created(
                    $"/identity/organisations/{organisationId}/invites/{response.InviteId}",
                    response);
            }
            catch (ArgumentException ex)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["request"] = [ex.Message],
                });
            }
        })
        .RequireAuthorization()
        .WithName("CreateOrganisationInvite")
        .WithTags("identity-organisations")
        .Accepts<CreateOrganisationInviteRequest>("application/json")
        .Produces<CreateOrganisationInviteResponse>(StatusCodes.Status201Created)
        .WithMetadata(new SwaggerRequestExampleAttribute(
            typeof(CreateOrganisationInviteRequest),
            typeof(CreateOrganisationInviteRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status201Created,
            typeof(CreateOrganisationInviteResponseExample)));

        app.MapPost("/identity/invites/{token}/accept", async (
            ClaimsPrincipal user,
            string token,
            AcceptOrganisationInviteHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await handler.HandleAsync(userId, token, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("AcceptOrganisationInvite")
        .WithTags("identity-organisations")
        .Produces<AcceptOrganisationInviteResponse>(StatusCodes.Status200OK)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(AcceptOrganisationInviteResponseExample)));

        app.MapPatch("/identity/organisations/{organisationId:guid}/members/{memberUserId:guid}", async (
            ClaimsPrincipal user,
            Guid organisationId,
            Guid memberUserId,
            UpdateOrganisationMemberRequest request,
            HttpRequest httpRequest,
            IIdentityModule identity,
            UpdateOrganisationMemberHandler handler,
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

            if (!resolution.Access!.CanManageTeam)
                return OrganisationApiResults.Forbidden();

            try
            {
                var member = await handler.HandleAsync(userId, organisationId, memberUserId, request, ct);
                return member is null ? Results.NotFound() : Results.Ok(member);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new ProblemDetails
                {
                    Title = "Member update conflict",
                    Detail = ex.Message,
                    Status = StatusCodes.Status409Conflict,
                });
            }
        })
        .RequireAuthorization()
        .WithName("UpdateOrganisationMember")
        .WithTags("identity-organisations")
        .Accepts<UpdateOrganisationMemberRequest>("application/json")
        .Produces<OrganisationMemberDto>(StatusCodes.Status200OK)
        .WithMetadata(new SwaggerRequestExampleAttribute(
            typeof(UpdateOrganisationMemberRequest),
            typeof(UpdateOrganisationMemberRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(OrganisationMemberExample)));

        app.MapDelete("/identity/organisations/{organisationId:guid}/members/{memberUserId:guid}", async (
            ClaimsPrincipal user,
            Guid organisationId,
            Guid memberUserId,
            HttpRequest httpRequest,
            IIdentityModule identity,
            RemoveOrganisationMemberHandler handler,
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

            if (!resolution.Access!.CanManageTeam)
                return OrganisationApiResults.Forbidden();

            try
            {
                var removed = await handler.HandleAsync(userId, organisationId, memberUserId, ct);
                return removed switch
                {
                    null => Results.NotFound(),
                    false => Results.NotFound(),
                    _ => Results.NoContent(),
                };
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new ProblemDetails
                {
                    Title = "Member removal conflict",
                    Detail = ex.Message,
                    Status = StatusCodes.Status409Conflict,
                });
            }
        })
        .RequireAuthorization()
        .WithName("RemoveOrganisationMember")
        .WithTags("identity-organisations")
        .Produces(StatusCodes.Status204NoContent);

        app.MapPost("/identity/organisations/{organisationId:guid}/closure", async (
            ClaimsPrincipal user,
            Guid organisationId,
            HttpRequest httpRequest,
            IIdentityModule identity,
            RequestOrganisationClosureHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var resolution = await identity.ResolveOrganisationAccessAsync(
                userId,
                OrganisationHttpExtensions.TryGetRequestedOrganisationId(httpRequest) ?? organisationId,
                ct);

            if (resolution.Status == OrganisationResolutionStatus.OrganisationClosed)
            {
                var closedResponse = await handler.HandleAsync(userId, organisationId, ct);
                return closedResponse is null ? Results.NotFound() : Results.Ok(closedResponse);
            }

            if (resolution.Status != OrganisationResolutionStatus.Success)
                return MapResolutionError(resolution.Status);

            if (!resolution.Access!.CanClose)
                return OrganisationApiResults.Forbidden();

            var response = await handler.HandleAsync(userId, organisationId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("RequestOrganisationClosure")
        .WithTags("identity-organisations")
        .Produces<OrganisationClosureResponse>(StatusCodes.Status200OK)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(OrganisationClosureResponseExample)));

        return app;
    }

    private static IResult MapResolutionError(OrganisationResolutionStatus status) =>
        status switch
        {
            OrganisationResolutionStatus.ContextRequired => OrganisationApiResults.ContextRequired(),
            OrganisationResolutionStatus.Forbidden => OrganisationApiResults.Forbidden(),
            OrganisationResolutionStatus.OrganisationClosed => OrganisationApiResults.OrganisationClosed(),
            _ => Results.StatusCode(StatusCodes.Status500InternalServerError),
        };
}
