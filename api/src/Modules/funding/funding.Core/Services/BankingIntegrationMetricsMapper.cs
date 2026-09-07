using funding.Contracts;
using funding.Core.Entities;
using juskel.Integrations.OpenBanking;

namespace funding.Core.Services;

internal static class BankingIntegrationMetricsMapper
{
    public static BankingIntegrationMetrics FromAggregates(
        Guid applicationId,
        DateOnly periodStart,
        DateOnly periodEnd,
        int connectionCount,
        int accountCount,
        decimal totalCashBalance,
        decimal totalCredits,
        decimal totalDebits,
        int transactionCount,
        bool hasNonGbpAccounts,
        int transactionDays)
    {
        var monthsInPeriod = Math.Max(1m, transactionDays / 30m);
        return new BankingIntegrationMetrics
        {
            ApplicationId = applicationId,
            Currency = "GBP",
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            SyncedAt = DateTime.UtcNow,
            ConnectionCount = connectionCount,
            AccountCount = accountCount,
            TotalCashBalance = totalCashBalance,
            TotalCredits = totalCredits,
            TotalDebits = totalDebits,
            NetCashFlow = totalCredits - totalDebits,
            AvgMonthlyInflow = totalCredits / monthsInPeriod,
            AvgMonthlyOutflow = totalDebits / monthsInPeriod,
            TransactionCount = transactionCount,
            HasNonGbpAccounts = hasNonGbpAccounts,
        };
    }

    public static BankingIntegrationMetricsDto ToDto(BankingIntegrationMetrics metrics) =>
        new(
            metrics.Currency,
            metrics.PeriodStart,
            metrics.PeriodEnd,
            metrics.SyncedAt,
            metrics.ConnectionCount,
            metrics.AccountCount,
            metrics.TotalCashBalance,
            metrics.TotalCredits,
            metrics.TotalDebits,
            metrics.NetCashFlow,
            metrics.AvgMonthlyInflow,
            metrics.AvgMonthlyOutflow,
            metrics.TransactionCount,
            metrics.HasNonGbpAccounts);

    public static OpenBankingConnectionDto ToConnectionDto(OpenBankingConnection connection, int accountCount) =>
        new(
            connection.Id,
            connection.InstitutionId,
            connection.InstitutionName,
            accountCount,
            connection.ConnectedAt,
            connection.ExpiresAt);

    public static int CountAccounts(OpenBankingConnection connection)
    {
        if (string.IsNullOrWhiteSpace(connection.AccountsJson) || connection.AccountsJson == "[]")
            return 0;

        try
        {
            var accounts = System.Text.Json.JsonSerializer.Deserialize<List<OpenBankingAccountSummary>>(connection.AccountsJson);
            return accounts?.Count ?? 0;
        }
        catch (System.Text.Json.JsonException)
        {
            return 0;
        }
    }
}
