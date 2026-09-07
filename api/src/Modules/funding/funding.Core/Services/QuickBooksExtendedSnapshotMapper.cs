using funding.Contracts;
using juskel.Integrations.QuickBooks;

namespace funding.Core.Services;

internal static class QuickBooksExtendedSnapshotMapper
{
    public static QuickBooksExtendedSnapshotDto ToDto(QuickBooksExtendedSnapshot snapshot) =>
        new(
            snapshot.ExternalRealmId,
            ToCompanyDto(snapshot.Company),
            snapshot.Accounts.Select(ToAccountDto).ToList(),
            snapshot.ReportLines.Select(ToReportLineDto).ToList(),
            ToAgingDto(snapshot.AgingReceivables),
            ToAgingDto(snapshot.AgingPayables),
            ToCashFlowDto(snapshot.CashFlow),
            snapshot.HasReportData,
            snapshot.PriorPeriodHasReportData);

    public static QuickBooksRawReportsDto ToRawDto(QuickBooksSyncArchiveRaw raw) =>
        new(
            raw.CompanyInfoJson,
            raw.ProfitAndLossJson,
            raw.ProfitAndLossPriorJson,
            raw.BalanceSheetJson,
            raw.AgedReceivablesJson,
            raw.AgedPayablesJson,
            raw.CashFlowJson,
            raw.AccountsJson);

    private static QuickBooksCompanyInfoDto ToCompanyDto(QuickBooksCompanyInfo company) =>
        new(
            company.CompanyName,
            company.LegalName,
            company.Country,
            company.Email,
            company.FiscalYearStartMonth,
            company.CompanyStartDate);

    private static QuickBooksAccountDto ToAccountDto(QuickBooksAccountDetail account) =>
        new(
            account.Id,
            account.Name,
            account.AccountType,
            account.AccountSubType,
            account.Classification,
            account.CurrentBalance,
            account.Currency);

    private static QuickBooksReportLineDto ToReportLineDto(QuickBooksReportLine line) =>
        new(line.Report, line.Label, line.Group, line.Amount);

    private static QuickBooksAgingBucketsDto? ToAgingDto(QuickBooksAgingBuckets? buckets) =>
        buckets is null
            ? null
            : new QuickBooksAgingBucketsDto(
                buckets.Total,
                buckets.Current,
                buckets.Days1To30,
                buckets.Days31To60,
                buckets.Days61To90,
                buckets.DaysOver90);

    private static QuickBooksCashFlowSectionsDto? ToCashFlowDto(QuickBooksCashFlowSections? cashFlow) =>
        cashFlow is null
            ? null
            : new QuickBooksCashFlowSectionsDto(
                cashFlow.Operating,
                cashFlow.Investing,
                cashFlow.Financing,
                cashFlow.NetChangeInCash);
}

internal sealed record QuickBooksSyncArchiveRaw(
    string? CompanyInfoJson,
    string? ProfitAndLossJson,
    string? ProfitAndLossPriorJson,
    string? BalanceSheetJson,
    string? AgedReceivablesJson,
    string? AgedPayablesJson,
    string? CashFlowJson,
    string? AccountsJson);
