using identity.Contracts;
using identity.Core.Examples;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Features.ResendOtp;

internal static class ResendOtpEndpoint
{
    internal static IEndpointRouteBuilder MapResendOtpEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/identity/verification/resend", async (
            ResendOtpRequest request,
            ResendOtpHandler handler,
            CancellationToken ct) =>
        {
            var command = new ResendOtpCommand(request.Email);
            var response = await handler.HandleAsync(command, ct);
            return Results.Accepted(value: response);
        })
        .WithName("ResendOtp")
        .WithTags("identity")
        .Accepts<ResendOtpRequest>("application/json")
        .Produces<ResendOtpResponse>(StatusCodes.Status202Accepted)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(ResendOtpRequest), typeof(ResendOtpRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status202Accepted, typeof(ResendOtpResponseExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status400BadRequest, typeof(ValidationProblemDetailsExample)));

        return app;
    }
}
