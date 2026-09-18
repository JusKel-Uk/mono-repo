using lender.Contracts;

namespace lender.Core.Entities;

internal sealed class LenderMember
{
    public Guid LenderOrganisationId { get; set; }

    public LenderOrganisation LenderOrganisation { get; set; } = null!;

    public Guid UserId { get; set; }

    public LenderMemberRole Role { get; set; }

    public DateTime JoinedAt { get; set; }
}
