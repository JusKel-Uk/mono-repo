using identity.Contracts;
using identity.Core.Examples;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Features.VerifyEmail;

internal static class VerifyEmailEndpoint
{
    internal static IEndpointRouteBuilder MapVerifyEmailEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/identity/verification", async (
            VerifyEmailRequest request,
            VerifyEmailHandler handler,
            CancellationToken ct) =>
        {
            var command = new VerifyEmailCommand(request.Email, request.OtpCode);
            var response = await handler.HandleAsync(command, ct);
            return Results.Ok(response);
        })
        .WithName("VerifyEmail")
        .WithTags("identity")
        .Accepts<VerifyEmailRequest>("application/json")
        .Produces<VerifyEmailResponse>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(VerifyEmailRequest), typeof(VerifyEmailRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(VerifyEmailResponseExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status400BadRequest, typeof(ValidationProblemDetailsExample)));

        return app;
    }
}