namespace funding.Core.Entities;

internal sealed class BankingCompletenessAttestation
{
    public Guid ApplicationId { get; set; }

    public Guid AttestedByUserId { get; set; }

    public DateTime AttestedAt { get; set; }

    public bool AllRelevantAccountsConnected { get; set; }
}
