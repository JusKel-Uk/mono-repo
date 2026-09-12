using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using funding.Contracts;
using funding.Core.Examples;
using funding.Core.Services;
using identity.Contracts;
using juskel.Shared;
using juskel.Shared.Organisation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
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
            HttpRequest request,
            IIdentityModule identity,
            FinancialProfileService service,
            CancellationToken ct,
            [FromQuery] bool includeRaw = false) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            var response = await service.GetAsync(access!.OrganisationId, includeRaw, ct);
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
            HttpRequest request,
            UpsertFinancialProfileRequest requestBody,
            IIdentityModule identity,
            FinancialProfileService service,
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
            HttpRequest request,
            IIdentityModule identity,
            FundingProfileService service,
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
        .WithName("GetFundingProfile")
        .Produces<FundingProfileResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(FundingProfileResponseExample)));

        group.MapPut("/applications/current/funding-profile", async (
            ClaimsPrincipal user,
            HttpRequest request,
            UpsertFundingProfileRequest requestBody,
            IIdentityModule identity,
            FundingProfileService service,
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
                var response = await service.UpsertAsync(access.OrganisationId, requestBody, ct);
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
            HttpRequest request,
            IIdentityModule identity,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            if (!access!.CanWrite)
                return OrganisationApiResults.Forbidden();

            var response = await service.BuildOpenBankingAuthorizationAsync(userId, access.OrganisationId, ct);
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
            IOptions<JuskelAppOptions> juskelOptions,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
                return Results.BadRequest();

            try
            {
                await service.HandleOpenBankingCallbackAsync(code, state, ct);
                return IntegrationCallbackResults.Connected(juskelOptions.Value, "open-banking");
            }
            catch (Exception ex) when (ex is InvalidOperationException or HttpRequestException)
            {
                return IntegrationCallbackResults.Failed(juskelOptions.Value, "open-banking", ex.Message);
            }
            catch (Exception ex)
            {
                return IntegrationCallbackResults.Failed(
                    juskelOptions.Value,
                    "open-banking",
                    ex.InnerException?.Message ?? ex.Message);
            }
        })
        .AllowAnonymous()
        .WithName("OpenBankingCallback")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status302Found)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapDelete("/integrations/open-banking", async (
            ClaimsPrincipal user,
            HttpRequest request,
            IIdentityModule identity,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            if (!access!.CanWrite)
                return OrganisationApiResults.Forbidden();

            var disconnected = await service.DisconnectAsync(userId, access.OrganisationId, IntegrationProvider.OpenBanking, ct);
            return disconnected ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DisconnectOpenBanking")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapGet("/integrations/open-banking/connections", async (
            ClaimsPrincipal user,
            HttpRequest request,
            IIdentityModule identity,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            var response = await service.GetOpenBankingConnectionsAsync(access!.OrganisationId, ct);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
        .WithName("GetOpenBankingConnections")
        .Produces<OpenBankingConnectionsResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(OpenBankingConnectionsResponseExample)));

        group.MapDelete("/integrations/open-banking/connections/{connectionId:guid}", async (
            ClaimsPrincipal user,
            HttpRequest request,
            Guid connectionId,
            IIdentityModule identity,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            if (!access!.CanWrite)
                return OrganisationApiResults.Forbidden();

            var disconnected = await service.DisconnectOpenBankingConnectionAsync(
                userId,
                access.OrganisationId,
                connectionId,
                ct);
            return disconnected ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DisconnectOpenBankingConnection")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapPut("/integrations/open-banking/completeness", async (
            ClaimsPrincipal user,
            HttpRequest request,
            UpsertBankingCompletenessRequest requestBody,
            IIdentityModule identity,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            if (!access!.CanWrite)
                return OrganisationApiResults.Forbidden();

            var saved = await service.UpsertBankingCompletenessAsync(
                userId,
                access.OrganisationId,
                requestBody,
                ct);
            return saved ? Results.NoContent() : Results.NotFound();
        })
        .WithName("UpsertBankingCompleteness")
        .Accepts<UpsertBankingCompletenessRequest>("application/json")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
        .WithMetadata(new SwaggerRequestExampleAttribute(typeof(UpsertBankingCompletenessRequest), typeof(UpsertBankingCompletenessRequestExample)));

        group.MapPost("/integrations/xero/authorize", async (
            ClaimsPrincipal user,
            HttpRequest request,
            IIdentityModule identity,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            if (!access!.CanWrite)
                return OrganisationApiResults.Forbidden();

            var response = await service.BuildXeroAuthorizationAsync(userId, access.OrganisationId, ct);
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
            IOptions<JuskelAppOptions> juskelOptions,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
                return Results.BadRequest();

            try
            {
                await service.HandleXeroCallbackAsync(code, state, ct);
                return IntegrationCallbackResults.Connected(juskelOptions.Value, "xero");
            }
            catch (Exception ex) when (ex is InvalidOperationException or HttpRequestException)
            {
                return IntegrationCallbackResults.Failed(juskelOptions.Value, "xero", ex.Message);
            }
        })
        .AllowAnonymous()
        .WithName("XeroCallback")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status302Found)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapDelete("/integrations/xero", async (
            ClaimsPrincipal user,
            HttpRequest request,
            IIdentityModule identity,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            if (!access!.CanWrite)
                return OrganisationApiResults.Forbidden();

            var disconnected = await service.DisconnectAsync(userId, access.OrganisationId, IntegrationProvider.Xero, ct);
            return disconnected ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DisconnectXero")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapPost("/integrations/quickbooks/authorize", async (
            ClaimsPrincipal user,
            HttpRequest request,
            IIdentityModule identity,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            if (!access!.CanWrite)
                return OrganisationApiResults.Forbidden();

            var response = await service.BuildQuickBooksAuthorizationAsync(userId, access.OrganisationId, ct);
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
            IOptions<JuskelAppOptions> juskelOptions,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
                return Results.BadRequest();

            try
            {
                var resolvedRealmId = string.IsNullOrWhiteSpace(realmId) ? realmIdLegacy : realmId;
                await service.HandleQuickBooksCallbackAsync(code, state, resolvedRealmId, ct);
                return IntegrationCallbackResults.Connected(juskelOptions.Value, "quickbooks");
            }
            catch (Exception ex) when (ex is InvalidOperationException or HttpRequestException)
            {
                return IntegrationCallbackResults.Failed(juskelOptions.Value, "quickbooks", ex.Message);
            }
        })
        .AllowAnonymous()
        .WithName("QuickBooksCallback")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status302Found)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapDelete("/integrations/quickbooks", async (
            ClaimsPrincipal user,
            HttpRequest request,
            IIdentityModule identity,
            IntegrationService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(user, out var userId))
                return Results.Unauthorized();

            var (access, error) = await OrganisationEndpointHelper.ResolveAsync(identity, userId, request, ct);
            if (error is not null)
                return error;

            if (!access!.CanWrite)
                return OrganisationApiResults.Forbidden();

            var disconnected = await service.DisconnectAsync(userId, access.OrganisationId, IntegrationProvider.QuickBooks, ct);
            return disconnected ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DisconnectQuickBooks")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapPost("/evidence", async (
            ClaimsPrincipal user,
            HttpRequest request,
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
                var response = await service.UploadAsync(access.OrganisationId, file, ct);
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
        .WithName("DownloadFinancialEvidence")
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
