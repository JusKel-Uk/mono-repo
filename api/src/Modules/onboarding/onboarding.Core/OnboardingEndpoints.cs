using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using onboarding.Contracts;
using onboarding.Core.Examples;
using onboarding.Core.Services;
using Swashbuckle.AspNetCore.Filters;

namespace onboarding.Core;

public static class OnboardingEndpoints
{
    public static WebApplication MapOnboardingEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/onboarding")
            .RequireAuthorization()
            .WithTags("onboarding");

        group.MapPost("/applications", async (
            ClaimsPrincipal user,
            OnboardingApplicationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await service.CreateApplicationAsync(userId, ct);
            return Results.Created($"/onboarding/applications/{response.ApplicationId}", response);
        })
        .WithName("CreateApplication")
        .Produces<CreateApplicationResponse>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status201Created, typeof(CreateApplicationResponseExample)));

        group.MapGet("/applications/current", async (
            ClaimsPrincipal user,
            OnboardingApplicationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await service.GetCurrentApplicationAsync(userId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .WithName("GetCurrentApplication")
        .Produces<ApplicationResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(ApplicationResponseExample)));

        group.MapGet("/applications/current/company-setup", async (
            ClaimsPrincipal user,
            CompanySetupService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await service.GetAsync(userId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .WithName("GetCompanySetup")
        .Produces<CompanySetupResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(CompanySetupResponseExample)));

        group.MapPut("/applications/current/company-setup", async (
            ClaimsPrincipal user,
            UpsertCompanySetupRequest request,
            CompanySetupService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            try
            {
                var response = await service.UpsertAsync(userId, request, ct);
                return response is null ? Results.NotFound() : Results.Ok(response);
            }
            catch (ArgumentException ex)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["request"] = [ex.Message],
                });
            }
        })
        .WithName("UpsertCompanySetup")
        .Accepts<UpsertCompanySetupRequest>("application/json")
        .Produces<CompanySetupResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(UpsertCompanySetupRequest), typeof(UpsertCompanySetupRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(CompanySetupResponseExample)));

        group.MapPost("/applications/current/company-setup/verify-companies-house", async (
            ClaimsPrincipal user,
            VerifyCompaniesHouseRequest request,
            CompanySetupService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await service.VerifyAsync(userId, request, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .RequireRateLimiting("companies-house-verify")
        .WithName("VerifyCompaniesHouse")
        .Accepts<VerifyCompaniesHouseRequest>("application/json")
        .Produces<VerifyCompaniesHouseResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status429TooManyRequests)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(VerifyCompaniesHouseRequest), typeof(VerifyCompaniesHouseRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(VerifyCompaniesHouseResponseExample)));

        group.MapGet("/applications/current/business-profile", async (
            ClaimsPrincipal user,
            BusinessProfileService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await service.GetAsync(userId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .WithName("GetBusinessProfile")
        .Produces<BusinessProfileResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(BusinessProfileResponseExample)));

        group.MapPut("/applications/current/business-profile", async (
            ClaimsPrincipal user,
            UpsertBusinessProfileRequest request,
            BusinessProfileService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            try
            {
                var response = await service.UpsertAsync(userId, request, ct);
                return response is null ? Results.NotFound() : Results.Ok(response);
            }
            catch (ArgumentException ex)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["request"] = [ex.Message],
                });
            }
        })
        .WithName("UpsertBusinessProfile")
        .Accepts<UpsertBusinessProfileRequest>("application/json")
        .Produces<BusinessProfileResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(UpsertBusinessProfileRequest), typeof(UpsertBusinessProfileRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(BusinessProfileResponseExample)));

        group.MapPost("/applications/current/submit", async (
            ClaimsPrincipal user,
            OnboardingApplicationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            try
            {
                var response = await service.SubmitApplicationAsync(userId, ct);
                return response is null ? Results.NotFound() : Results.Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new ProblemDetails
                {
                    Title = "Submission incomplete",
                    Detail = ex.Message,
                    Status = StatusCodes.Status409Conflict,
                });
            }
        })
        .WithName("SubmitApplication")
        .Produces<SubmitApplicationResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(SubmitApplicationResponseExample)));

        return app;
    }

    private static bool TryGetUserId(ClaimsPrincipal user, out Guid userId)
    {
        var userIdValue = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(userIdValue, out userId);
    }
}
