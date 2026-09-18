namespace identity.Contracts;

public interface IPortalMembershipChecker
{
    string Portal { get; }

    Task<bool> IsMemberByEmailAsync(string email, CancellationToken ct = default);
}
