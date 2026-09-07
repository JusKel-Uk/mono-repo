namespace funding.Core.Entities;

internal sealed class BankingIntegrationMetrics
{
    public Guid ApplicationId { get; set; }

    public string Currency { get; set; } = "GBP";

    public DateOnly PeriodStart { get; set; }

    public DateOnly PeriodEnd { get; set; }

    public DateTime SyncedAt { get; set; }

    public int ConnectionCount { get; set; }

    public int AccountCount { get; set; }

    public decimal TotalCashBalance { get; set; }

    public decimal TotalCredits { get; set; }

    public decimal TotalDebits { get; set; }

    public decimal NetCashFlow { get; set; }

    public decimal AvgMonthlyInflow { get; set; }

    public decimal AvgMonthlyOutflow { get; set; }

    public int TransactionCount { get; set; }

    public bool HasNonGbpAccounts { get; set; }
}
