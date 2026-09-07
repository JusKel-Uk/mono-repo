namespace identity.Core.Entities;

internal sealed class Organisation
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>Lowercase email domain for members and invites (e.g. acme.co.uk).</summary>
    public string EmailDomain { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? ClosureRequestedAt { get; set; }

    public ICollection<OrganisationMember> Members { get; set; } = [];

    public ICollection<OrganisationInvite> Invites { get; set; } = [];
}
