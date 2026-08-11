using identity.Contracts;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace juskel.Api.Infrastructure;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, title, problemType, extensions) = exception switch
        {
            EmailNotVerifiedException emailNotVerified => (
                StatusCodes.Status403Forbidden,
                "Email not verified.",
                "https://juskel.com/problems/email-not-verified",
                new Dictionary<string, object?>
                {
                    ["errorCode"] = IdentityErrorCodes.EmailNotVerified,
                    ["email"] = emailNotVerified.Email
                }),
            ArgumentException => (
                StatusCodes.Status400BadRequest,
                "Validation failed.",
                (string?)null,
                null),
            _ => (
                StatusCodes.Status500InternalServerError,
                "An error occurred while processing your request.",
                (string?)null,
                null)
        };

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Type = problemType,
            Detail = exception.Message
        };

        if (extensions is not null)
        {
            foreach (var (key, value) in extensions)
                problemDetails.Extensions[key] = value;
        }

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
