using identity.Contracts;
using juskel.Shared.Security;
using lender.Contracts;
using lender.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace lender.Core;

internal sealed class LenderModule : ILenderModule, IPortalMembershipChecker
{
    private readonly LenderDbContext _db;
    private readonly IEmailLookupHasher _emailLookupHasher;
    private readonly IIdentityAuthService _identityAuth;

    public LenderModule(
        LenderDbContext db,
        IEmailLookupHasher emailLookupHasher,
        IIdentityAuthService identityAuth)
    {
        _db = db;
        _emailLookupHasher = emailLookupHasher;
        _identityAuth = identityAuth;
    }

    public string Portal => PortalNames.Lender;

    public async Task<bool> IsLenderUserAsync(Guid userId, CancellationToken ct = default) =>
        await _db.LenderMembers.AsNoTracking().AnyAsync(m => m.UserId == userId, ct);

    public async Task<bool> IsLenderEmailAsync(string email, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        var userId = await _identityAuth.GetUserIdByEmailAsync(email, ct);
        if (userId is not null && await IsLenderUserAsync(userId.Value, ct))
            return true;

        var emailLookupHash = _emailLookupHasher.ComputeHash(email);
        return await _db.LenderInvites
            .AsNoTracking()
            .AnyAsync(
                i => i.EmailLookupHash == emailLookupHash
                    && i.ConsumedAt == null
                    && i.ExpiresAt >= DateTime.UtcNow,
                ct);
    }

    public Task<bool> IsMemberByEmailAsync(string email, CancellationToken ct = default) =>
        IsLenderEmailAsync(email, ct);
}
