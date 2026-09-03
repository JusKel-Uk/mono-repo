using funding.Contracts;
using funding.Core.Entities;
using juskel.Integrations.QuickBooks;

namespace funding.Core.Services;

internal static class FinancialIntegrationMetricsMapper
{
    public static FinancialIntegrationMetrics FromQuickBooksSnapshot(
        Guid applicationId,
        QuickBooksFinancialSnapshot snapshot) =>
        new()
        {
            ApplicationId = applicationId,
            Provider = IntegrationProvider.QuickBooks,
            Currency = snapshot.Currency,
            PeriodStart = snapshot.PeriodStart,
            PeriodEnd = snapshot.PeriodEnd,
            PriorPeriodEnd = snapshot.PriorPeriodEnd,
            BalanceSheetAsOf = snapshot.BalanceSheetAsOf,
            SyncedAt = DateTime.UtcNow,
            AnnualRevenue = snapshot.AnnualRevenue,
            PriorAnnualRevenue = snapshot.PriorAnnualRevenue,
            GrossProfit = snapshot.GrossProfit,
            OperatingProfit = snapshot.OperatingProfit,
            NetIncome = snapshot.NetIncome,
            PriorNetIncome = snapshot.PriorNetIncome,
            Ebitda = snapshot.Ebitda,
            CashBalance = snapshot.CashBalance,
            AccountsReceivable = snapshot.AccountsReceivable,
            AccountsPayable = snapshot.AccountsPayable,
            CurrentAssets = snapshot.CurrentAssets,
            CurrentLiabilities = snapshot.CurrentLiabilities,
            WorkingCapital = snapshot.WorkingCapital,
            TotalAssets = snapshot.TotalAssets,
            TotalLiabilities = snapshot.TotalLiabilities,
            TotalEquity = snapshot.TotalEquity,
            OutstandingDebt = snapshot.OutstandingDebt,
            OperatingCashFlow = snapshot.OperatingCashFlow,
            CurrentRatio = snapshot.CurrentRatio,
            DebtToAssets = snapshot.DebtToAssets,
            ProfitMargin = snapshot.ProfitMargin,
            RevenueGrowthYoY = snapshot.RevenueGrowthYoY,
            NetIncomeGrowthYoY = snapshot.NetIncomeGrowthYoY,
            AccountCount = snapshot.AccountCount,
            HasReportData = snapshot.HasReportData,
            PriorPeriodHasReportData = snapshot.PriorPeriodHasReportData,
        };

    public static FinancialIntegrationMetricsDto ToDto(FinancialIntegrationMetrics metrics) =>
        new(
            metrics.Provider,
            metrics.Currency,
            metrics.PeriodStart,
            metrics.PeriodEnd,
            metrics.PriorPeriodEnd,
            metrics.BalanceSheetAsOf,
            metrics.SyncedAt,
            metrics.AnnualRevenue,
            metrics.PriorAnnualRevenue,
            metrics.GrossProfit,
            metrics.OperatingProfit,
            metrics.NetIncome,
            metrics.PriorNetIncome,
            metrics.Ebitda,
            metrics.CashBalance,
            metrics.AccountsReceivable,
            metrics.AccountsPayable,
            metrics.CurrentAssets,
            metrics.CurrentLiabilities,
            metrics.WorkingCapital,
            metrics.TotalAssets,
            metrics.TotalLiabilities,
            metrics.TotalEquity,
            metrics.OutstandingDebt,
            metrics.OperatingCashFlow,
            metrics.CurrentRatio,
            metrics.DebtToAssets,
            metrics.ProfitMargin,
            metrics.RevenueGrowthYoY,
            metrics.NetIncomeGrowthYoY,
            metrics.AccountCount,
            metrics.HasReportData,
            metrics.PriorPeriodHasReportData);
}
