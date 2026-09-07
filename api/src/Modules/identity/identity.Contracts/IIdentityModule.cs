namespace identity.Contracts;

public interface IIdentityModule
{
    Task<UserSummaryDto?> GetUserAsync(Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<OrganisationSummaryDto>> ListOrganisationsAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<OrganisationAccessDto?> GetOrganisationAccessAsync(
        Guid userId,
        Guid organisationId,
        CancellationToken ct = default);

    Task<OrganisationResolutionResult> ResolveOrganisationAccessAsync(
        Guid userId,
        Guid? requestedOrganisationId,
        CancellationToken ct = default);
}
