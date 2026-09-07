using Microsoft.AspNetCore.Http;

namespace juskel.Shared.Organisation;

public static class OrganisationHttpExtensions
{
    public static Guid? TryGetRequestedOrganisationId(HttpRequest request)
    {
        if (!request.Headers.TryGetValue(OrganisationHeaders.OrganisationId, out var values))
            return null;

        var value = values.FirstOrDefault();
        return Guid.TryParse(value, out var organisationId) ? organisationId : null;
    }
}
