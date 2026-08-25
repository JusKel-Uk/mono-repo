namespace funding.Contracts;

public sealed record IntegrationStatusDto(
    IntegrationProvider Provider,
    bool IsConnected,
    DateTime? ConnectedAt,
    DateTime? ExpiresAt);

public sealed record FinancialProfileResponse(
    Guid ApplicationId,
    RevenueBand? RevenueBand,
    EbitdaBand? EbitdaBand,
    DebtBand? DebtBand,
    CashReservesBand? CashReservesBand,
    MonthlyRevenueBand? MonthlyRevenueBand,
    bool BandsLockedByIntegration,
    bool IsOpenBankingConnected,
    IReadOnlyList<IntegrationStatusDto> Integrations,
    DateTime UpdatedAt);

public sealed record UpsertFinancialProfileRequest(
    RevenueBand? RevenueBand,
    EbitdaBand? EbitdaBand,
    DebtBand? DebtBand,
    CashReservesBand? CashReservesBand,
    MonthlyRevenueBand? MonthlyRevenueBand);

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
