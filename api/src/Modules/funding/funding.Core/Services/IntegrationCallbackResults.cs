using juskel.Shared;
using Microsoft.AspNetCore.Http;

namespace funding.Core.Services;

internal static class IntegrationCallbackResults
{
    public static IResult Connected(JuskelAppOptions options, string integration) =>
        TryRedirect(options, integration, "connected")
        ?? Results.Ok(new { status = "connected", provider = integration });

    public static IResult Failed(JuskelAppOptions options, string integration, string? detail = null) =>
        TryRedirect(options, integration, "error")
        ?? Results.Problem(
            title: "Integration connection failed",
            detail: detail ?? "The provider callback could not be completed.",
            statusCode: StatusCodes.Status500InternalServerError);

    private static IResult? TryRedirect(JuskelAppOptions options, string integration, string status)
    {
        var url = IntegrationCallbackRedirects.FinancialProfile(options.FrontendUrl, integration, status);
        return url is null ? null : Results.Redirect(url);
    }
}
