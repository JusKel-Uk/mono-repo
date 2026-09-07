using identity.Contracts;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Services;

internal static class OrganisationMemberGuards
{
    public static async Task<int> CountOwnersAsync(
        IdentityDbContext db,
        Guid organisationId,
        CancellationToken ct) =>
        await db.OrganisationMembers
            .CountAsync(
                m => m.OrganisationId == organisationId && m.Role == OrganisationRole.Owner,
                ct);

    public static bool IsLastOwner(OrganisationRole role, int ownerCount) =>
        role == OrganisationRole.Owner && ownerCount <= 1;
}
