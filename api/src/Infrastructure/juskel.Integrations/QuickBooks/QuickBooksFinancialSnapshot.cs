namespace juskel.Integrations.QuickBooks;

public sealed record QuickBooksFinancialSnapshot(
    string CompanyName,
    string Currency,
    bool HasReportData,
    bool PriorPeriodHasReportData,
    DateOnly PeriodStart,
    DateOnly PeriodEnd,
    DateOnly? PriorPeriodEnd,
    DateOnly BalanceSheetAsOf,
    decimal? AnnualRevenue,
    decimal? PriorAnnualRevenue,
    decimal? GrossProfit,
    decimal? OperatingProfit,
    decimal? NetIncome,
    decimal? PriorNetIncome,
    decimal? Ebitda,
    decimal CashBalance,
    decimal? AccountsReceivable,
    decimal? AccountsPayable,
    decimal? CurrentAssets,
    decimal? CurrentLiabilities,
    decimal? WorkingCapital,
    decimal? TotalAssets,
    decimal? TotalLiabilities,
    decimal? TotalEquity,
    decimal OutstandingDebt,
    decimal? OperatingCashFlow,
    decimal? CurrentRatio,
    decimal? DebtToAssets,
    decimal? ProfitMargin,
    decimal? RevenueGrowthYoY,
    decimal? NetIncomeGrowthYoY,
    int AccountCount);

public sealed record QuickBooksSyncResult(
    QuickBooksFinancialSnapshot Snapshot,
    OAuthTokenResult? RefreshedTokens);
