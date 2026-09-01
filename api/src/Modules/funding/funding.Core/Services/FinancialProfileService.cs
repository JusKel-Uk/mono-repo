using funding.Contracts;
using funding.Core.Entities;
using funding.Core.Persistence;
using juskel.Integrations.OpenBanking;
using Microsoft.EntityFrameworkCore;
using onboarding.Contracts;

namespace funding.Core.Services;

internal sealed class FinancialProfileService
{
    private readonly FundingDbContext _db;
    private readonly IOnboardingModule _onboarding;
    private readonly IFundingModule _funding;

    public FinancialProfileService(
        FundingDbContext db,
        IOnboardingModule onboarding,
        IFundingModule funding)
    {
        _db = db;
        _onboarding = onboarding;
        _funding = funding;
    }

    public async Task<FinancialProfileResponse?> GetAsync(Guid userId, CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetCurrentApplicationIdAsync(userId, ct);
        if (applicationId is null)
            return null;

        var profile = await _db.FinancialProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);

        var integrations = await _funding.GetIntegrationStatusAsync(applicationId.Value, ct);
        var isOpenBankingConnected = integrations.Any(i =>
            i.Provider == IntegrationProvider.OpenBanking && i.IsConnected);

        var evidence = await LoadEvidenceAsync(applicationId.Value, ct);

        if (profile is null && !integrations.Any(i => i.IsConnected) && evidence.Count == 0)
            return null;

        profile ??= new FinancialProfile { ApplicationId = applicationId.Value, UpdatedAt = DateTime.UtcNow };

        return Map(profile, integrations, isOpenBankingConnected, evidence);
    }

    public async Task<FinancialProfileResponse?> UpsertAsync(
        Guid userId,
        UpsertFinancialProfileRequest request,
        CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct)
            ?? throw new InvalidOperationException("Draft application not found.");

        var profile = await _db.FinancialProfiles
            .FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);

        var openBankingConnected = await _db.IntegrationConnections
            .AsNoTracking()
            .AnyAsync(i => i.ApplicationId == applicationId && i.Provider == IntegrationProvider.OpenBanking, ct);

        profile ??= new FinancialProfile { ApplicationId = applicationId };

        if (profile.BandsLockedByIntegration || openBankingConnected)
            throw new InvalidOperationException("Financial bands are locked by an active integration.");

        profile.AnnualRevenueBand = request.AnnualRevenueBand;
        profile.EbitdaBand = request.EbitdaBand;
        profile.ExistingDebtBand = request.ExistingDebtBand;
        profile.CashReserves = request.CashReserves;
        profile.AvgMonthlyRevenue = request.AvgMonthlyRevenue;
        profile.UpdatedAt = DateTime.UtcNow;

        if (_db.Entry(profile).State == EntityState.Detached)
            _db.FinancialProfiles.Add(profile);

        await _db.SaveChangesAsync(ct);

        var status = await _funding.IsFinancialStepCompleteAsync(applicationId, ct)
            ? StepStatus.Complete
            : StepStatus.InProgress;
        await _onboarding.MarkStepAsync(applicationId, OnboardingStep.Financial, status, ct);

        var integrations = await _funding.GetIntegrationStatusAsync(applicationId, ct);
        var evidence = await LoadEvidenceAsync(applicationId, ct);
        return Map(profile, integrations, openBankingConnected, evidence);
    }

    internal static void ApplyOpenBankingBands(FinancialProfile profile, IReadOnlyList<OpenBankingAccountSummary> accounts)
    {
        var totalBalance = accounts.Sum(a => a.CurrentBalance);
        profile.AnnualRevenueBand = MapAnnualRevenue(totalBalance * 12m);
        profile.EbitdaBand = EbitdaMarginBand.Margin5To15;
        profile.ExistingDebtBand = ExistingDebtBand.Under50K;
        profile.CashReserves = MapCashReservesMonths(totalBalance);
        profile.AvgMonthlyRevenue = MapAvgMonthlyRevenue(totalBalance);
        profile.BandsLockedByIntegration = true;
        profile.UpdatedAt = DateTime.UtcNow;
    }

    private async Task<IReadOnlyList<EvidenceResponse>> LoadEvidenceAsync(
        Guid applicationId,
        CancellationToken ct) =>
        await _db.FinancialEvidence
            .AsNoTracking()
            .Where(e => e.ApplicationId == applicationId)
            .OrderByDescending(e => e.UploadedAt)
            .Select(e => new EvidenceResponse(
                e.Id,
                e.ApplicationId,
                e.FileName,
                e.ContentType,
                e.FileSizeBytes,
                e.UploadedAt))
            .ToListAsync(ct);

    private static FinancialProfileResponse Map(
        FinancialProfile profile,
        IReadOnlyList<IntegrationStatusDto> integrations,
        bool isOpenBankingConnected,
        IReadOnlyList<EvidenceResponse> evidence) =>
        new(
            profile.ApplicationId,
            profile.AnnualRevenueBand,
            profile.EbitdaBand,
            profile.ExistingDebtBand,
            profile.CashReserves,
            profile.AvgMonthlyRevenue,
            profile.BandsLockedByIntegration,
            isOpenBankingConnected,
            integrations,
            evidence,
            profile.UpdatedAt);

    private static AnnualRevenueBand MapAnnualRevenue(decimal annualAmount) => annualAmount switch
    {
        < 250_000m => AnnualRevenueBand.Under250K,
        < 1_000_000m => AnnualRevenueBand.From250KTo1M,
        < 5_000_000m => AnnualRevenueBand.From1MTo5M,
        < 25_000_000m => AnnualRevenueBand.From5MTo25M,
        _ => AnnualRevenueBand.Over25M,
    };

    private static CashReservesMonthsBand MapCashReservesMonths(decimal balance)
    {
        const decimal assumedMonthlyBurn = 20_000m;
        var months = assumedMonthlyBurn > 0 ? balance / assumedMonthlyBurn : 0m;
        return months switch
        {
            < 1m => CashReservesMonthsBand.Under1Month,
            < 3m => CashReservesMonthsBand.From1To3Months,
            < 6m => CashReservesMonthsBand.From3To6Months,
            < 12m => CashReservesMonthsBand.From6To12Months,
            _ => CashReservesMonthsBand.Over12Months,
        };
    }

    private static AvgMonthlyRevenueBand MapAvgMonthlyRevenue(decimal monthlyAmount) => monthlyAmount switch
    {
        < 20_000m => AvgMonthlyRevenueBand.Under20K,
        < 80_000m => AvgMonthlyRevenueBand.From20KTo80K,
        < 400_000m => AvgMonthlyRevenueBand.From80KTo400K,
        < 1_000_000m => AvgMonthlyRevenueBand.From400KTo1M,
        _ => AvgMonthlyRevenueBand.Over1M,
    };
}
