using lender.Contracts;

namespace lender.Core.Entities;

internal sealed class LenderAccessRequest
{
    public Guid Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string WorkEmail { get; set; } = string.Empty;

    public string WorkEmailLookupHash { get; set; } = string.Empty;

    public string Organisation { get; set; } = string.Empty;

    public string? Website { get; set; }

    public string? JobTitle { get; set; }

    public string? Message { get; set; }

    public LenderAccessRequestStatus Status { get; set; }

    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public Guid? LenderOrganisationId { get; set; }

    public LenderOrganisation? LenderOrganisation { get; set; }
}
