using identity.Contracts;
using identity.Core.Examples;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Features.RegisterUser;

internal static class RegisterUserEndpoint
{
    internal static IEndpointRouteBuilder MapRegisterUserEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/identity/users", async (
            RegisterUserRequest request,
            RegisterUserHandler handler,
            CancellationToken ct) =>
        {
            var command = new RegisterUserCommand(
                request.FirstName,
                request.LastName,
                request.Email,
                request.Password);

            var response = await handler.HandleAsync(command, ct);
            return Results.Created($"/identity/users/{response.UserId}", response);
        })
        .WithName("RegisterUser")
        .WithTags("identity")
        .Accepts<RegisterUserRequest>("application/json")
        .Produces<RegisterUserResponse>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(RegisterUserRequest), typeof(RegisterUserRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status201Created, typeof(RegisterUserResponseExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status400BadRequest, typeof(ValidationProblemDetailsExample)));

        return app;
    }
}