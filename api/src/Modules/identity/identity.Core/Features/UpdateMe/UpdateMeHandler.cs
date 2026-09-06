using identity.Contracts;
using identity.Core.Features.GetMe;
using identity.Core.Persistence;
using identity.Core.Validation;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.UpdateMe;

internal sealed class UpdateMeHandler
{
    private readonly IdentityDbContext _db;

    public UpdateMeHandler(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<MeProfileDto?> HandleAsync(UpdateMeCommand command, CancellationToken ct = default)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == command.UserId && u.DeletedAt == null, ct);

        if (user is null)
            return null;

        user.FirstName = ProfileFieldValidator.RequireName(command.FirstName, "First name");
        user.LastName = ProfileFieldValidator.RequireName(command.LastName, "Last name");
        user.JobTitle = ProfileFieldValidator.NormalizeJobTitle(command.JobTitle);
        user.Phone = ProfileFieldValidator.NormalizePhone(command.Phone);
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return MeProfileMapping.FromUser(user);
    }
}
