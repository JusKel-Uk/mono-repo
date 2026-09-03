using funding.Contracts;

namespace funding.Core.Entities;

public sealed class FinancialIntegrationMetrics
{
    public Guid ApplicationId { get; set; }

    public IntegrationProvider Provider { get; set; }

    public string Currency { get; set; } = "GBP";

    public DateOnly PeriodStart { get; set; }

    public DateOnly PeriodEnd { get; set; }

    public DateOnly? PriorPeriodEnd { get; set; }

    public DateOnly BalanceSheetAsOf { get; set; }

    public DateTime SyncedAt { get; set; }

    public decimal? AnnualRevenue { get; set; }

    public decimal? PriorAnnualRevenue { get; set; }

    public decimal? GrossProfit { get; set; }

    public decimal? OperatingProfit { get; set; }

    public decimal? NetIncome { get; set; }

    public decimal? PriorNetIncome { get; set; }

    public decimal? Ebitda { get; set; }

    public decimal? CashBalance { get; set; }

    public decimal? AccountsReceivable { get; set; }

    public decimal? AccountsPayable { get; set; }

    public decimal? CurrentAssets { get; set; }

    public decimal? CurrentLiabilities { get; set; }

    public decimal? WorkingCapital { get; set; }

    public decimal? TotalAssets { get; set; }

    public decimal? TotalLiabilities { get; set; }

    public decimal? TotalEquity { get; set; }

    public decimal? OutstandingDebt { get; set; }

    public decimal? OperatingCashFlow { get; set; }

    public decimal? CurrentRatio { get; set; }

    public decimal? DebtToAssets { get; set; }

    public decimal? ProfitMargin { get; set; }

    public decimal? RevenueGrowthYoY { get; set; }

    public decimal? NetIncomeGrowthYoY { get; set; }

    public int AccountCount { get; set; }

    public bool HasReportData { get; set; }

    public bool PriorPeriodHasReportData { get; set; }
}
