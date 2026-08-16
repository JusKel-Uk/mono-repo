using identity.Core.Entities;
using identity.Core.Persistence;
using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Services;

internal static class IdentityPiiBackfill
{
    public static async Task RunAsync(
        IdentityDbContext db,
        IEmailLookupHasher emailLookupHasher,
        CancellationToken ct = default)
    {
        var users = await db.Users
            .Where(u => u.EmailLookupHash == null || u.EmailLookupHash == string.Empty)
            .ToListAsync(ct);

        if (users.Count == 0)
            return;

        var now = DateTime.UtcNow;

        foreach (var user in users)
        {
            var email = emailLookupHasher.NormalizeEmail(user.Email);
            user.EmailLookupHash = emailLookupHasher.ComputeHash(email);
            user.Email = email;
            user.FirstName = user.FirstName;
            user.LastName = user.LastName;
            user.UpdatedAt = now;
        }

        await db.SaveChangesAsync(ct);
    }
}
