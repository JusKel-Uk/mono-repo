using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using funding.Contracts;
using funding.Core.Examples;
using funding.Core.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Filters;

namespace funding.Core;

public static class FundingEndpoints
{
    public static WebApplication MapFundingEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/funding")
            .RequireAuthorization()
            .WithTags("funding");

        group.MapGet("/applications/current/financial-profile", async (
            ClaimsPrincipal user,
            FinancialProfileService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await service.GetAsync(userId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .WithName("GetFinancialProfile")
        .Produces<FinancialProfileResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(FinancialProfileResponseExample)));

        group.MapPut("/applications/current/financial-profile", async (
            ClaimsPrincipal user,
            UpsertFinancialProfileRequest request,
            FinancialProfileService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            try
            {
                var response = await service.UpsertAsync(userId, request, ct);
                return response is null ? Results.NotFound() : Results.Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new ProblemDetails
                {
                    Title = "Financial profile locked",
                    Detail = ex.Message,
                    Status = StatusCodes.Status409Conflict,
                });
            }
        })
        .WithName("UpsertFinancialProfile")
        .Accepts<UpsertFinancialProfileRequest>("application/json")
        .Produces<FinancialProfileResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(UpsertFinancialProfileRequest), typeof(UpsertFinancialProfileRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(FinancialProfileResponseExample)));

        group.MapGet("/applications/current/funding-profile", async (
            ClaimsPrincipal user,
            FundingProfileService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await service.GetAsync(userId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .WithName("GetFundingProfile")
        .Produces<FundingProfileResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(FundingProfileResponseExample)));

        group.MapPut("/applications/current/funding-profile", async (
            ClaimsPrincipal user,
            UpsertFundingProfileRequest request,
            FundingProfileService service,
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
        .WithName("UpsertFundingProfile")
        .Accepts<UpsertFundingProfileRequest>("application/json")
        .Produces<FundingProfileResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(UpsertFundingProfileRequest), typeof(UpsertFundingProfileRequestExample)))
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(FundingProfileResponseExample)));

        group.MapPost("/integrations/open-banking/authorize", async (
            ClaimsPrincipal user,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await service.BuildOpenBankingAuthorizationAsync(userId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .WithName("AuthorizeOpenBanking")
        .Produces<OAuthAuthorizeResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(OAuthAuthorizeResponseExample)));

        group.MapGet("/integrations/open-banking/callback", async (
            [FromQuery] string code,
            [FromQuery] string state,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
                return Results.BadRequest();

            await service.HandleOpenBankingCallbackAsync(code, state, ct);
            return Results.Ok(new { status = "connected", provider = "open-banking" });
        })
        .AllowAnonymous()
        .WithName("OpenBankingCallback")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapDelete("/integrations/open-banking", async (
            ClaimsPrincipal user,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var disconnected = await service.DisconnectAsync(userId, IntegrationProvider.OpenBanking, ct);
            return disconnected ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DisconnectOpenBanking")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapPost("/integrations/xero/authorize", async (
            ClaimsPrincipal user,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await service.BuildXeroAuthorizationAsync(userId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .WithName("AuthorizeXero")
        .Produces<OAuthAuthorizeResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(OAuthAuthorizeResponseExample)));

        group.MapGet("/integrations/xero/callback", async (
            [FromQuery] string code,
            [FromQuery] string state,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
                return Results.BadRequest();

            await service.HandleXeroCallbackAsync(code, state, ct);
            return Results.Ok(new { status = "connected", provider = "xero" });
        })
        .AllowAnonymous()
        .WithName("XeroCallback")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapDelete("/integrations/xero", async (
            ClaimsPrincipal user,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var disconnected = await service.DisconnectAsync(userId, IntegrationProvider.Xero, ct);
            return disconnected ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DisconnectXero")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapPost("/integrations/quickbooks/authorize", async (
            ClaimsPrincipal user,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var response = await service.BuildQuickBooksAuthorizationAsync(userId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .WithName("AuthorizeQuickBooks")
        .Produces<OAuthAuthorizeResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(OAuthAuthorizeResponseExample)));

        group.MapGet("/integrations/quickbooks/callback", async (
            [FromQuery] string code,
            [FromQuery] string state,
            [FromQuery] string? realmId,
            [FromQuery(Name = "realmID")] string? realmIdLegacy,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
                return Results.BadRequest();

            var resolvedRealmId = string.IsNullOrWhiteSpace(realmId) ? realmIdLegacy : realmId;
            await service.HandleQuickBooksCallbackAsync(code, state, resolvedRealmId, ct);
            return Results.Ok(new { status = "connected", provider = "quickbooks" });
        })
        .AllowAnonymous()
        .WithName("QuickBooksCallback")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapDelete("/integrations/quickbooks", async (
            ClaimsPrincipal user,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var disconnected = await service.DisconnectAsync(userId, IntegrationProvider.QuickBooks, ct);
            return disconnected ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DisconnectQuickBooks")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapPost("/evidence", async (
            ClaimsPrincipal user,
            IFormFile file,
            EvidenceService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            try
            {
                var response = await service.UploadAsync(userId, file, ct);
                return response is null ? Results.NotFound() : Results.Created($"/funding/evidence/{response!.EvidenceId}", response);
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
        .WithName("UploadFinancialEvidence")
        .Produces<EvidenceResponse>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status201Created, typeof(EvidenceResponseExample)));

        group.MapGet("/evidence/{evidenceId:guid}/download", async (
            ClaimsPrincipal user,
            Guid evidenceId,
            EvidenceService service,
            CancellationToken ct,
            [FromQuery] bool download = false) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var file = await service.DownloadAsync(userId, evidenceId, ct);
            if (file is null)
                return Results.NotFound();

            return Results.File(
                file.Content,
                file.ContentType,
                fileDownloadName: download ? file.FileName : null,
                enableRangeProcessing: true);
        })
        .WithName("DownloadFinancialEvidence")
        .Produces(StatusCodes.Status200OK, contentType: "application/octet-stream")
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

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
        .WithName("DeleteFinancialEvidence")
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
