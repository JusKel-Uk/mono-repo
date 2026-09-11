namespace juskel.Integrations.QuickBooks;

public sealed record QuickBooksRawPayloads(
    string CompanyInfoJson,
    string ProfitAndLossJson,
    string ProfitAndLossPriorJson,
    string BalanceSheetJson,
    string AgedReceivablesJson,
    string AgedPayablesJson,
    string CashFlowJson,
    string AccountsJson);

public sealed record QuickBooksCompanyInfo(
    string CompanyName,
    string? LegalName,
    string? Country,
    string? Email,
    string? FiscalYearStartMonth,
    DateOnly? CompanyStartDate);

public sealed record QuickBooksAccountDetail(
    string? Id,
    string? Name,
    string? AccountType,
    string? AccountSubType,
    string? Classification,
    decimal CurrentBalance,
    string? Currency);

public sealed record QuickBooksReportLine(
    string Report,
    string Label,
    string? Group,
    decimal? Amount);

public sealed record QuickBooksAgingBuckets(
    decimal? Total,
    decimal? Current,
    decimal? Days1To30,
    decimal? Days31To60,
    decimal? Days61To90,
    decimal? DaysOver90);

public sealed record QuickBooksCashFlowSections(
    decimal? Operating,
    decimal? Investing,
    decimal? Financing,
    decimal? NetChangeInCash);

public sealed record QuickBooksExtendedSnapshot(
    string ExternalRealmId,
    QuickBooksCompanyInfo Company,
    IReadOnlyList<QuickBooksAccountDetail> Accounts,
    IReadOnlyList<QuickBooksReportLine> ReportLines,
    QuickBooksAgingBuckets? AgingReceivables,
    QuickBooksAgingBuckets? AgingPayables,
    QuickBooksCashFlowSections? CashFlow,
    bool HasReportData,
    bool PriorPeriodHasReportData);
