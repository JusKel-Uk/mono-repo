namespace lender.Contracts;

public interface ILenderModule
{
    Task<bool> IsLenderUserAsync(Guid userId, CancellationToken ct = default);

    Task<bool> IsLenderEmailAsync(string email, CancellationToken ct = default);
}
