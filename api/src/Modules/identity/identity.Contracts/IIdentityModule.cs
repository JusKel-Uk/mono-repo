namespace identity.Contracts;

public interface IIdentityModule
{
    Task<UserSummaryDto?> GetUserAsync(Guid id, CancellationToken ct = default);
}
