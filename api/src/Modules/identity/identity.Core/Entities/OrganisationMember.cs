using identity.Contracts;

namespace identity.Core.Entities;

internal sealed class OrganisationMember
{
    public Guid OrganisationId { get; set; }

    public Organisation Organisation { get; set; } = null!;

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public OrganisationRole Role { get; set; }

    public DateTime JoinedAt { get; set; }
}
