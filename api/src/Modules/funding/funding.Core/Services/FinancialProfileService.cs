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
        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct);
        if (applicationId is null)
            return null;

        var profile = await _db.FinancialProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);

        var integrations = await _funding.GetIntegrationStatusAsync(applicationId.Value, ct);
        var isOpenBankingConnected = integrations.Any(i =>
            i.Provider == IntegrationProvider.OpenBanking && i.IsConnected);

        if (profile is null && !integrations.Any(i => i.IsConnected))
            return null;

        profile ??= new FinancialProfile { ApplicationId = applicationId.Value, UpdatedAt = DateTime.UtcNow };

        return Map(profile, integrations, isOpenBankingConnected);
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

        profile.RevenueBand = request.RevenueBand;
        profile.EbitdaBand = request.EbitdaBand;
        profile.DebtBand = request.DebtBand;
        profile.CashReservesBand = request.CashReservesBand;
        profile.MonthlyRevenueBand = request.MonthlyRevenueBand;
        profile.UpdatedAt = DateTime.UtcNow;

        if (_db.Entry(profile).State == EntityState.Detached)
            _db.FinancialProfiles.Add(profile);

        await _db.SaveChangesAsync(ct);

        var status = await _funding.IsFinancialStepCompleteAsync(applicationId, ct)
            ? StepStatus.Complete
            : StepStatus.InProgress;
        await _onboarding.MarkStepAsync(applicationId, OnboardingStep.Financial, status, ct);

        var integrations = await _funding.GetIntegrationStatusAsync(applicationId, ct);
        return Map(profile, integrations, openBankingConnected);
    }

    internal static void ApplyOpenBankingBands(FinancialProfile profile, IReadOnlyList<OpenBankingAccountSummary> accounts)
    {
        var totalBalance = accounts.Sum(a => a.CurrentBalance);
        profile.RevenueBand = MapRevenue(totalBalance);
        profile.EbitdaBand = EbitdaBand.From50KTo250K;
        profile.DebtBand = DebtBand.Under100K;
        profile.CashReservesBand = MapCash(totalBalance);
        profile.MonthlyRevenueBand = MapMonthly(totalBalance);
        profile.BandsLockedByIntegration = true;
        profile.UpdatedAt = DateTime.UtcNow;
    }

    private static FinancialProfileResponse Map(
        FinancialProfile profile,
        IReadOnlyList<IntegrationStatusDto> integrations,
        bool isOpenBankingConnected) =>
        new(
            profile.ApplicationId,
            profile.RevenueBand,
            profile.EbitdaBand,
            profile.DebtBand,
            profile.CashReservesBand,
            profile.MonthlyRevenueBand,
            profile.BandsLockedByIntegration,
            isOpenBankingConnected,
            integrations,
            profile.UpdatedAt);

    private static RevenueBand MapRevenue(decimal balance) => balance switch
    {
        < 100_000m => RevenueBand.Under100K,
        < 500_000m => RevenueBand.From100KTo500K,
        < 1_000_000m => RevenueBand.From500KTo1M,
        < 5_000_000m => RevenueBand.From1MTo5M,
        _ => RevenueBand.Over5M,
    };

    private static CashReservesBand MapCash(decimal balance) => balance switch
    {
        < 10_000m => CashReservesBand.Under10K,
        < 50_000m => CashReservesBand.From10KTo50K,
        < 250_000m => CashReservesBand.From50KTo250K,
        < 1_000_000m => CashReservesBand.From250KTo1M,
        _ => CashReservesBand.Over1M,
    };

    private static MonthlyRevenueBand MapMonthly(decimal balance) => balance switch
    {
        < 10_000m => MonthlyRevenueBand.Under10K,
        < 50_000m => MonthlyRevenueBand.From10KTo50K,
        < 100_000m => MonthlyRevenueBand.From50KTo100K,
        < 500_000m => MonthlyRevenueBand.From100KTo500K,
        _ => MonthlyRevenueBand.Over500K,
    };
}
