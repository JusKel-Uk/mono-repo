namespace lender.Core.Entities;

internal sealed class LenderOrganisation
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Website { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<LenderMember> Members { get; set; } = [];

    public ICollection<LenderInvite> Invites { get; set; } = [];
}
