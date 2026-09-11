namespace funding.Contracts;

public sealed record IntegrationStatusDto(
    IntegrationProvider Provider,
    bool IsConnected,
    DateTime? ConnectedAt,
    DateTime? ExpiresAt);

public sealed record FinancialIntegrationMetricsDto(
    IntegrationProvider Provider,
    string Currency,
    DateOnly PeriodStart,
    DateOnly PeriodEnd,
    DateOnly? PriorPeriodEnd,
    DateOnly BalanceSheetAsOf,
    DateTime SyncedAt,
    decimal? AnnualRevenue,
    decimal? PriorAnnualRevenue,
    decimal? GrossProfit,
    decimal? OperatingProfit,
    decimal? NetIncome,
    decimal? PriorNetIncome,
    decimal? Ebitda,
    decimal? CashBalance,
    decimal? AccountsReceivable,
    decimal? AccountsPayable,
    decimal? CurrentAssets,
    decimal? CurrentLiabilities,
    decimal? WorkingCapital,
    decimal? TotalAssets,
    decimal? TotalLiabilities,
    decimal? TotalEquity,
    decimal? OutstandingDebt,
    decimal? OperatingCashFlow,
    decimal? CurrentRatio,
    decimal? DebtToAssets,
    decimal? ProfitMargin,
    decimal? RevenueGrowthYoY,
    decimal? NetIncomeGrowthYoY,
    int AccountCount,
    bool HasReportData,
    bool PriorPeriodHasReportData);

public sealed record QuickBooksCompanyInfoDto(
    string CompanyName,
    string? LegalName,
    string? Country,
    string? Email,
    string? FiscalYearStartMonth,
    DateOnly? CompanyStartDate);

public sealed record QuickBooksAccountDto(
    string? Id,
    string? Name,
    string? AccountType,
    string? AccountSubType,
    string? Classification,
    decimal CurrentBalance,
    string? Currency);

public sealed record QuickBooksReportLineDto(
    string Report,
    string Label,
    string? Group,
    decimal? Amount);

public sealed record QuickBooksAgingBucketsDto(
    decimal? Total,
    decimal? Current,
    decimal? Days1To30,
    decimal? Days31To60,
    decimal? Days61To90,
    decimal? DaysOver90);

public sealed record QuickBooksCashFlowSectionsDto(
    decimal? Operating,
    decimal? Investing,
    decimal? Financing,
    decimal? NetChangeInCash);

public sealed record QuickBooksExtendedSnapshotDto(
    string ExternalRealmId,
    QuickBooksCompanyInfoDto Company,
    IReadOnlyList<QuickBooksAccountDto> Accounts,
    IReadOnlyList<QuickBooksReportLineDto> ReportLines,
    QuickBooksAgingBucketsDto? AgingReceivables,
    QuickBooksAgingBucketsDto? AgingPayables,
    QuickBooksCashFlowSectionsDto? CashFlow,
    bool HasReportData,
    bool PriorPeriodHasReportData);

public sealed record QuickBooksRawReportsDto(
    string? CompanyInfo,
    string? ProfitAndLoss,
    string? ProfitAndLossPrior,
    string? BalanceSheet,
    string? AgedReceivables,
    string? AgedPayables,
    string? CashFlow,
    string? Accounts);

public sealed record FinancialProfileResponse(
    Guid ApplicationId,
    AnnualRevenueBand? AnnualRevenueBand,
    EbitdaMarginBand? EbitdaBand,
    ExistingDebtBand? ExistingDebtBand,
    CashReservesMonthsBand? CashReserves,
    AvgMonthlyRevenueBand? AvgMonthlyRevenue,
    bool BandsLockedByIntegration,
    bool IsOpenBankingConnected,
    IReadOnlyList<IntegrationStatusDto> Integrations,
    IReadOnlyList<EvidenceResponse> Evidence,
    FinancialIntegrationMetricsDto? IntegrationMetrics,
    QuickBooksExtendedSnapshotDto? QuickBooksExtended,
    QuickBooksRawReportsDto? QuickBooksRaw,
    IReadOnlyList<OpenBankingConnectionDto> ConnectedBanks,
    BankingIntegrationMetricsDto? BankingIntegrationMetrics,
    BankingCompletenessAttestationDto? BankingCompleteness,
    DateTime UpdatedAt);

public sealed record OpenBankingConnectionDto(
    Guid ConnectionId,
    string InstitutionId,
    string InstitutionName,
    int AccountCount,
    DateTime ConnectedAt,
    DateTime? ExpiresAt);

public sealed record OpenBankingConnectionsResponse(
    IReadOnlyList<OpenBankingConnectionDto> Connections);

public sealed record BankingIntegrationMetricsDto(
    string Currency,
    DateOnly PeriodStart,
    DateOnly PeriodEnd,
    DateTime SyncedAt,
    int ConnectionCount,
    int AccountCount,
    decimal TotalCashBalance,
    decimal TotalCredits,
    decimal TotalDebits,
    decimal NetCashFlow,
    decimal AvgMonthlyInflow,
    decimal AvgMonthlyOutflow,
    int TransactionCount,
    bool HasNonGbpAccounts);

public sealed record BankingCompletenessAttestationDto(
    bool AllRelevantAccountsConnected,
    DateTime AttestedAt,
    Guid AttestedByUserId);

public sealed record UpsertBankingCompletenessRequest(
    bool AllRelevantAccountsConnected);

public sealed record UpsertFinancialProfileRequest(
    AnnualRevenueBand? AnnualRevenueBand,
    EbitdaMarginBand? EbitdaBand,
    ExistingDebtBand? ExistingDebtBand,
    CashReservesMonthsBand? CashReserves,
    AvgMonthlyRevenueBand? AvgMonthlyRevenue);

public sealed record FundingProfileResponse(
    Guid ApplicationId,
    decimal RequestedAmount,
    FundingPurpose Purpose,
    int TermMonths,
    FundingUrgency Urgency,
    DateTime UpdatedAt);

public sealed record UpsertFundingProfileRequest(
    decimal RequestedAmount,
    FundingPurpose Purpose,
    int TermMonths,
    FundingUrgency Urgency);

public sealed record EvidenceResponse(
    Guid EvidenceId,
    Guid ApplicationId,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    DateTime UploadedAt);

public sealed record OAuthAuthorizeResponse(string AuthorizationUrl, string State);

public interface IFundingModule
{
    Task<bool> IsFinancialStepCompleteAsync(Guid applicationId, CancellationToken ct = default);

    Task<bool> IsFundingStepCompleteAsync(Guid applicationId, CancellationToken ct = default);

    Task<IReadOnlyList<IntegrationStatusDto>> GetIntegrationStatusAsync(
        Guid applicationId,
        CancellationToken ct = default);
}
