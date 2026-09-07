using juskel.Shared.Organisation;
using Microsoft.AspNetCore.Http;

namespace identity.Contracts;

public static class OrganisationEndpointHelper
{
    public static async Task<(OrganisationAccessDto? Access, IResult? Error)> ResolveAsync(
        IIdentityModule identity,
        Guid userId,
        HttpRequest request,
        CancellationToken ct = default)
    {
        var requestedOrganisationId = OrganisationHttpExtensions.TryGetRequestedOrganisationId(request);
        var resolution = await identity.ResolveOrganisationAccessAsync(userId, requestedOrganisationId, ct);

        return resolution.Status switch
        {
            OrganisationResolutionStatus.Success => (resolution.Access, null),
            OrganisationResolutionStatus.ContextRequired => (null, OrganisationApiResults.ContextRequired()),
            OrganisationResolutionStatus.Forbidden => (null, OrganisationApiResults.Forbidden()),
            OrganisationResolutionStatus.OrganisationClosed => (null, OrganisationApiResults.OrganisationClosed()),
            _ => (null, Results.StatusCode(StatusCodes.Status500InternalServerError)),
        };
    }
}
