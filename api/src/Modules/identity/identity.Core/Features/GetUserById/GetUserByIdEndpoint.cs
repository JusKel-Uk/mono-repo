using identity.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using identity.Core.Examples;
using Swashbuckle.AspNetCore.Filters;


namespace identity.Core.Features.GetUserById;


internal static class GetUserByIdEndpoint
{
    internal static IEndpointRouteBuilder MapGetUserByIdEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/identity/users/{id:guid}",async(
            Guid id,
            GetUserByIdHandler handler,
            CancellationToken ct)=>{
                var user = await handler.HandleAsync(new GetUserByIdQuery(id),ct);
                return user is null? Results.NotFound():Results.Ok(user);
            })
            .WithName("GetUserById")
            .WithTags("identity")
            .Produces<UserSummaryDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
            .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(UserSummaryExample)));
            return app;
    }
}
