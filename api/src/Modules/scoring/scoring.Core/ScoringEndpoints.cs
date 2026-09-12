using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using identity.Contracts;
using juskel.Shared.Organisation;
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
            HttpRequest request,
            IIdentityModule identity,
            SustainabilityProfileService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            var response = await service.GetAsync(access!.OrganisationId, ct);
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
            HttpRequest request,
            UpsertSustainabilityProfileRequest requestBody,
            IIdentityModule identity,
            SustainabilityProfileService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            if (!access!.CanWrite)
                return OrganisationApiResults.Forbidden();

            try
            {
                var response = await service.UpsertAsync(userId, access.OrganisationId, requestBody, ct);
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
            HttpRequest request,
            [FromForm] SustainabilityQuestionKey questionKey,
            IFormFile file,
            IIdentityModule identity,
            EvidenceService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            if (!access!.CanWrite)
                return OrganisationApiResults.Forbidden();

            try
            {
                var response = await service.UploadAsync(access.OrganisationId, questionKey, file, ct);
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

        group.MapGet("/evidence/{evidenceId:guid}/download", async (
            ClaimsPrincipal user,
            HttpRequest request,
            Guid evidenceId,
            IIdentityModule identity,
            EvidenceService service,
            CancellationToken ct,
            [FromQuery] bool download = false) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            var file = await service.DownloadAsync(access!.OrganisationId, evidenceId, ct);
            if (file is null)
                return Results.NotFound();

            return Results.File(
                file.Content,
                file.ContentType,
                fileDownloadName: download ? file.FileName : null,
                enableRangeProcessing: true);
        })
        .WithName("DownloadSustainabilityEvidence")
        .Produces(StatusCodes.Status200OK, contentType: "application/octet-stream")
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapDelete("/evidence/{evidenceId:guid}", async (
            ClaimsPrincipal user,
            HttpRequest request,
            Guid evidenceId,
            IIdentityModule identity,
            EvidenceService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            if (!access!.CanWrite)
                return OrganisationApiResults.Forbidden();

            var deleted = await service.DeleteAsync(access.OrganisationId, evidenceId, ct);
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
