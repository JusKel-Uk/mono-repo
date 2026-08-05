using identity.Contracts;
using identity.Core.Examples;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Features.SignIn;

internal static class SignInEndpoint
{
    internal static IEndpointRouteBuilder MapSignInEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/identity/sessions", async (
            SignInRequest request,
            SignInHandler handler,
            CancellationToken ct) =>
        {
            var command = new SignInCommand(request.Email, request.Password);
            var response = await handler.HandleAsync(command, ct);
            return Results.Created($"/identity/users/{response.UserId}", response);
        })
        .WithName("SignIn")
        .WithTags("identity")
        .Accepts<SignInRequest>("application/json")
        .Produces<SignInResponse>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(SignInRequest), typeof(SignInRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status400BadRequest, typeof(ValidationProblemDetailsExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status201Created, typeof(SignInResponseExample)));

        return app;
    }
}