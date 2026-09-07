using identity.Contracts;
using identity.Core.Persistence;

namespace identity.Core.Features.Organisations;

internal sealed class ListOrganisationsHandler
{
    private readonly IIdentityModule _identity;

    public ListOrganisationsHandler(IIdentityModule identity) => _identity = identity;

    public Task<IReadOnlyList<OrganisationSummaryDto>> HandleAsync(
        Guid userId,
        CancellationToken ct = default) =>
        _identity.ListOrganisationsAsync(userId, ct);
}
