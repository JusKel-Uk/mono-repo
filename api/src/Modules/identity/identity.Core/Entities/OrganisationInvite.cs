using identity.Contracts;

namespace identity.Core.Entities;

internal sealed class OrganisationInvite
{
    public Guid Id { get; set; }

    public Guid OrganisationId { get; set; }

    public Organisation Organisation { get; set; } = null!;

    public string EmailLookupHash { get; set; } = string.Empty;

    public OrganisationRole Role { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime? AcceptedAt { get; set; }

    public Guid InvitedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }
}
