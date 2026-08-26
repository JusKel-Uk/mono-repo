using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using scoring.Contracts;
using scoring.Core.Examples;
using scoring.Core.Services;
using Swashbuckle.AspNetCore.Filters;

namespace scoring.Core;

public static class ScoringEndpoints
{
    public static WebApplication MapScoringEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/scoring")
            .RequireAuthorization()
            .WithTags("scoring");

        group.MapGet("/applications/current/sustainability-profile", async (
            ClaimsPrincipal user,
            SustainabilityProfileService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await service.GetAsync(userId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .WithName("GetSustainabilityProfile")
        .Produces<SustainabilityProfileResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(SustainabilityProfileResponseExample)));

        group.MapPut("/applications/current/sustainability-profile", async (
            ClaimsPrincipal user,
            UpsertSustainabilityProfileRequest request,
            SustainabilityProfileService service,
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
        .WithName("UpsertSustainabilityProfile")
        .Accepts<UpsertSustainabilityProfileRequest>("application/json")
        .Produces<SustainabilityProfileResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(UpsertSustainabilityProfileRequest), typeof(UpsertSustainabilityProfileRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(SustainabilityProfileResponseExample)));

        group.MapPost("/evidence", async (
            ClaimsPrincipal user,
            [FromForm] SustainabilityQuestionKey questionKey,
            IFormFile file,
            EvidenceService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            try
            {
                var response = await service.UploadAsync(userId, questionKey, file, ct);
                return response is null ? Results.NotFound() : Results.Created($"/scoring/evidence/{response!.EvidenceId}", response);
            }
            catch (ArgumentException ex)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["file"] = [ex.Message],
                });
            }
        })
        .DisableAntiforgery()
        .WithName("UploadSustainabilityEvidence")
        .Produces<SustainabilityEvidenceResponse>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status201Created, typeof(SustainabilityEvidenceResponseExample)));

        group.MapDelete("/evidence/{evidenceId:guid}", async (
            ClaimsPrincipal user,
            Guid evidenceId,
            EvidenceService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var deleted = await service.DeleteAsync(userId, evidenceId, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DeleteSustainabilityEvidence")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        return app;
    }

    private static bool TryGetUserId(ClaimsPrincipal user, out Guid userId)
    {
        var userIdValue = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(userIdValue, out userId);
    }
}
