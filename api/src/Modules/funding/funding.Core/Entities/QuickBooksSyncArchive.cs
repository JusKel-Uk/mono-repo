namespace funding.Core.Entities;

internal sealed class QuickBooksSyncArchive
{
    public Guid ApplicationId { get; set; }

    public string ExternalRealmId { get; set; } = string.Empty;

    public DateTime SyncedAt { get; set; }

    public DateOnly PeriodStart { get; set; }

    public DateOnly PeriodEnd { get; set; }

    public string? CompanyInfoJson { get; set; }

    public string? ProfitAndLossJson { get; set; }

    public string? ProfitAndLossPriorJson { get; set; }

    public string? BalanceSheetJson { get; set; }

    public string? AgedReceivablesJson { get; set; }

    public string? AgedPayablesJson { get; set; }

    public string? CashFlowJson { get; set; }

    public string? AccountsJson { get; set; }

    public string? ExtendedSnapshotJson { get; set; }
}
