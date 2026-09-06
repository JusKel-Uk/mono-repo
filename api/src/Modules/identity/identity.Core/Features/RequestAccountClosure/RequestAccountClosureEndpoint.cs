using identity.Contracts;
using identity.Core.Examples;
using identity.Core.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;
using System.Security.Claims;

namespace identity.Core.Features.RequestAccountClosure;

internal static class RequestAccountClosureEndpoint
{
    internal static IEndpointRouteBuilder MapRequestAccountClosureEndpoint(
        this IEndpointRouteBuilder app)
    {
        app.MapPost("/identity/me/account-closure", async (
            ClaimsPrincipal user,
            RequestAccountClosureHandler handler,
            CancellationToken ct) =>
        {
            if (!IdentityHttpUser.TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await handler.HandleAsync(userId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("RequestAccountClosure")
        .WithTags("identity")
        .Produces<AccountClosureResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(
            StatusCodes.Status200OK,
            typeof(AccountClosureResponseExample)));

        return app;
    }
}
