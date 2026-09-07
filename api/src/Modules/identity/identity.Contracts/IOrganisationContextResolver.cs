namespace identity.Contracts;

public interface IOrganisationContextResolver
{
    Task<OrganisationResolutionResult> ResolveAsync(
        Guid userId,
        Guid? requestedOrganisationId,
        CancellationToken ct = default);
}
