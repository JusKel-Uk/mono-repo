using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.Organisations;

internal sealed class ListOrganisationMembersHandler
{
    private readonly IdentityDbContext _db;

    public ListOrganisationMembersHandler(IdentityDbContext db) => _db = db;

    public async Task<IReadOnlyList<OrganisationMemberDto>?> HandleAsync(
        Guid userId,
        Guid organisationId,
        CancellationToken ct = default)
    {
        var isMember = await _db.OrganisationMembers
            .AnyAsync(m => m.UserId == userId && m.OrganisationId == organisationId, ct);

        if (!isMember)
            return null;

        var members = await _db.OrganisationMembers
            .AsNoTracking()
            .Include(m => m.User)
            .Where(m => m.OrganisationId == organisationId && m.User.DeletedAt == null)
            .OrderBy(m => m.User.FirstName)
            .ThenBy(m => m.User.LastName)
            .ToListAsync(ct);

        return members
            .Select(m => new OrganisationMemberDto(
                m.UserId,
                m.User.Email,
                m.User.FirstName,
                m.User.LastName,
                m.Role,
                m.JoinedAt))
            .ToList();
    }
}
