using identity.Contracts;
using identity.Core.Entities;

namespace identity.Core.Features.GetMe;

internal static class MeProfileMapping
{
    public static MeProfileDto FromUser(User user) => new(
        user.Id,
        user.Email,
        user.FirstName,
        user.LastName,
        user.JobTitle,
        user.Phone);
}
