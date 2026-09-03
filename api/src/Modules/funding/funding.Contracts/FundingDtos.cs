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
    DateTime UpdatedAt);

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
