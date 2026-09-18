using lender.Contracts;
using lender.Core.Authorization;
using lender.Core.Examples;
using lender.Core.Features.Admin;
using lender.Core.Features.CreateAccount;
using lender.Core.Features.GetMe;
using lender.Core.Features.PreviewInvite;
using lender.Core.Features.RequestAccess;
using lender.Core.Features.SignIn;
using lender.Core.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Swashbuckle.AspNetCore.Filters;

namespace lender.Core;

public static class LenderEndpoints
{
    public const string LenderAdminPolicy = "LenderAdmin";

    public static WebApplication MapLenderEndpoints(this WebApplication app)
    {
        app.MapPost("/lender/access-requests", async (
            LenderRequestAccessRequest request,
            RequestAccessHandler handler,
            CancellationToken ct) =>
        {
            var response = await handler.HandleAsync(request, ct);
            return Results.Accepted($"/lender/admin/access-requests/{response.RequestId}", response);
        })
        .AllowAnonymous()
        .RequireRateLimiting("lender-access-request")
        .WithName("RequestLenderAccess")
        .WithTags("lender")
        .Accepts<LenderRequestAccessRequest>("application/json")
        .Produces<LenderAccessRequestAcceptedResponse>(StatusCodes.Status202Accepted)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status429TooManyRequests)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(LenderRequestAccessRequest), typeof(LenderRequestAccessRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status202Accepted, typeof(LenderAccessRequestAcceptedResponseExample)));

        app.MapGet("/lender/invites/preview", async (
            string token,
            PreviewInviteHandler handler,
            CancellationToken ct) =>
        {
            var preview = await handler.HandleAsync(token, ct);
            return preview is null ? Results.NotFound() : Results.Ok(preview);
        })
        .AllowAnonymous()
        .RequireRateLimiting("lender-invite-preview")
        .WithName("PreviewLenderInvite")
        .WithTags("lender")
        .Produces<LenderInvitePreviewResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status429TooManyRequests)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(LenderInvitePreviewResponseExample)));

        app.MapPost("/lender/accounts", async (
            LenderCreateAccountRequest request,
            HttpContext http,
            CreateAccountHandler handler,
            CancellationToken ct) =>
        {
            var response = await handler.HandleAsync(
                request,
                http.Request.Headers.UserAgent.ToString(),
                http.Connection.RemoteIpAddress?.ToString(),
                ct);
            return Results.Created($"/identity/users/{response.UserId}", response);
        })
        .AllowAnonymous()
        .RequireRateLimiting("lender-account-create")
        .WithName("CreateLenderAccount")
        .WithTags("lender")
        .Accepts<LenderCreateAccountRequest>("application/json")
        .Produces<LenderCreateAccountResponse>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status429TooManyRequests)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(LenderCreateAccountRequest), typeof(LenderCreateAccountRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status201Created, typeof(LenderCreateAccountResponseExample)));

        app.MapPost("/lender/sessions", async (
            LenderSignInRequest request,
            HttpContext http,
            LenderSignInHandler handler,
            CancellationToken ct) =>
        {
            var response = await handler.HandleAsync(
                request,
                http.Request.Headers.UserAgent.ToString(),
                http.Connection.RemoteIpAddress?.ToString(),
                ct);
            return Results.Created($"/identity/users/{response.UserId}", response);
        })
        .AllowAnonymous()
        .WithName("LenderSignIn")
        .WithTags("lender")
        .Accepts<LenderSignInRequest>("application/json")
        .Produces<LenderSignInResponse>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status403Forbidden)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(LenderSignInRequest), typeof(LenderSignInRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status201Created, typeof(LenderSignInResponseExample)));

        var admin = app.MapGroup("/lender/admin")
            .RequireAuthorization(LenderAdminPolicy)
            .WithTags("lender-admin");

        admin.MapGet("/access-requests", async (
            LenderAccessRequestStatus? status,
            ListAccessRequestsHandler handler,
            CancellationToken ct) =>
        {
            var items = await handler.HandleAsync(status, ct);
            return Results.Ok(items);
        })
        .WithName("ListLenderAccessRequests")
        .Produces<IReadOnlyList<LenderAccessRequestSummaryDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(LenderAccessRequestListExample)));

        admin.MapGet("/access-requests/{id:guid}", async (
            Guid id,
            GetAccessRequestHandler handler,
            CancellationToken ct) =>
        {
            var item = await handler.HandleAsync(id, ct);
            return item is null ? Results.NotFound() : Results.Ok(item);
        })
        .WithName("GetLenderAccessRequest")
        .Produces<LenderAccessRequestSummaryDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(LenderAccessRequestSummaryExample)));

        admin.MapPost("/access-requests/{id:guid}/approve", async (
            Guid id,
            ApproveAccessRequestHandler handler,
            CancellationToken ct) =>
        {
            var item = await handler.HandleAsync(id, ct);
            return item is null ? Results.NotFound() : Results.Ok(item);
        })
        .WithName("ApproveLenderAccessRequest")
        .Produces<LenderAccessRequestSummaryDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(LenderAccessRequestSummaryExample)));

        admin.MapPost("/access-requests/{id:guid}/reject", async (
            Guid id,
            LenderRejectAccessRequest request,
            RejectAccessRequestHandler handler,
            CancellationToken ct) =>
        {
            var item = await handler.HandleAsync(id, request, ct);
            return item is null ? Results.NotFound() : Results.Ok(item);
        })
        .WithName("RejectLenderAccessRequest")
        .Accepts<LenderRejectAccessRequest>("application/json")
        .Produces<LenderAccessRequestSummaryDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(LenderRejectAccessRequest), typeof(LenderRejectAccessRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(LenderAccessRequestSummaryExample)));

        app.MapGet("/lender/me", async (
            HttpContext http,
            GetMeHandler handler,
            CancellationToken ct) =>
        {
            if (!LenderHttpUser.TryGetUserId(http.User, out var userId))
                return Results.Unauthorized();

            if (!LenderHttpUser.HasLenderPortal(http.User))
                return Results.Forbid();

            var me = await handler.HandleAsync(userId, ct);
            return me is null ? Results.NotFound() : Results.Ok(me);
        })
        .RequireAuthorization()
        .WithName("GetLenderMe")
        .WithTags("lender")
        .Produces<LenderMeResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(LenderMeResponseExample)));

        return app;
    }
}
