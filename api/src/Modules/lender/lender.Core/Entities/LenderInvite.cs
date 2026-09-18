namespace lender.Core.Entities;

internal sealed class LenderInvite
{
    public const int ExpiryDays = 14;

    public Guid Id { get; set; }

    public Guid AccessRequestId { get; set; }

    public LenderAccessRequest AccessRequest { get; set; } = null!;

    public Guid LenderOrganisationId { get; set; }

    public LenderOrganisation LenderOrganisation { get; set; } = null!;

    public string EmailLookupHash { get; set; } = string.Empty;

    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime? ConsumedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
