using juskel.Api.Contracts.Examples;
using juskel.Api.Contracts.Responses;
using juskel.Api.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Filters;

namespace juskel.Api;

public static class LookupsEndpoints
{
    public static WebApplication MapLookupsEndpoints(this WebApplication app)
    {
        app.MapGet("/lookups", (ILookupCatalog catalog) => Results.Ok(catalog.GetAll()))
            .WithName("GetAllLookups")
            .WithTags("lookups")
            .Produces<LookupsResponse>(StatusCodes.Status200OK)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
            .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(LookupsResponseExample)));

        var onboarding = app.MapGroup("/onboarding")
            .WithTags("onboarding");

        onboarding.MapGet("/lookups", (ILookupCatalog catalog) => Results.Ok(catalog.GetOnboarding()))
            .WithName("GetOnboardingLookups")
            .Produces<LookupsResponse>(StatusCodes.Status200OK)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
            .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(OnboardingLookupsResponseExample)));

        var funding = app.MapGroup("/funding")
            .WithTags("funding");

        funding.MapGet("/lookups", (ILookupCatalog catalog) => Results.Ok(catalog.GetFunding()))
            .WithName("GetFundingLookups")
            .Produces<LookupsResponse>(StatusCodes.Status200OK)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
            .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(FundingLookupsResponseExample)));

        var scoring = app.MapGroup("/scoring")
            .WithTags("scoring");

        scoring.MapGet("/lookups", (ILookupCatalog catalog) => Results.Ok(catalog.GetScoring()))
            .WithName("GetScoringLookups")
            .Produces<LookupsResponse>(StatusCodes.Status200OK)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
            .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(ScoringLookupsResponseExample)));

        return app;
    }
}
