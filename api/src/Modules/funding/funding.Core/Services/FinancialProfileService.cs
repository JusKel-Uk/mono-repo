using funding.Contracts;
using funding.Core.Entities;
using funding.Core.Persistence;
using juskel.Integrations.QuickBooks;
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

    public async Task<FinancialProfileResponse?> GetAsync(Guid organisationId, CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetCurrentApplicationIdAsync(organisationId, ct);
        if (applicationId is null)
            return null;

        var profile = await _db.FinancialProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);

        var integrations = await _funding.GetIntegrationStatusAsync(applicationId.Value, ct);
        var isOpenBankingConnected = integrations.Any(i =>
            i.Provider == IntegrationProvider.OpenBanking && i.IsConnected);

        var evidence = await LoadEvidenceAsync(applicationId.Value, ct);
        var integrationMetrics = await LoadIntegrationMetricsAsync(applicationId.Value, ct);
        var connectedBanks = await LoadConnectedBanksAsync(applicationId.Value, ct);
        var bankingMetrics = await LoadBankingMetricsAsync(applicationId.Value, ct);
        var bankingCompleteness = await LoadBankingCompletenessAsync(applicationId.Value, ct);

        if (profile is null
            && !integrations.Any(i => i.IsConnected)
            && evidence.Count == 0
            && integrationMetrics is null
            && connectedBanks.Count == 0
            && bankingMetrics is null)
            return null;

        profile ??= new FinancialProfile { ApplicationId = applicationId.Value, UpdatedAt = DateTime.UtcNow };

        return Map(
            profile,
            integrations,
            isOpenBankingConnected,
            evidence,
            integrationMetrics,
            connectedBanks,
            bankingMetrics,
            bankingCompleteness);
    }

    public async Task<FinancialProfileResponse?> UpsertAsync(
        Guid organisationId,
        UpsertFinancialProfileRequest request,
        CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetDraftApplicationIdAsync(organisationId, ct)
            ?? throw new InvalidOperationException("Draft application not found.");

        var profile = await _db.FinancialProfiles
            .FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);

        var integrationLocked = await _db.OpenBankingConnections
            .AsNoTracking()
            .AnyAsync(c => c.ApplicationId == applicationId, ct)
            || await _db.IntegrationConnections
                .AsNoTracking()
                .AnyAsync(
                    i => i.ApplicationId == applicationId && i.Provider == IntegrationProvider.QuickBooks,
                    ct);

        profile ??= new FinancialProfile { ApplicationId = applicationId };

        if (profile.BandsLockedByIntegration || integrationLocked)
            return await AcknowledgeLockedProfileAsync(applicationId, profile, ct);

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
        var isOpenBankingConnected = integrations.Any(i =>
            i.Provider == IntegrationProvider.OpenBanking && i.IsConnected);
        var evidence = await LoadEvidenceAsync(applicationId, ct);
        var integrationMetrics = await LoadIntegrationMetricsAsync(applicationId, ct);
        var connectedBanks = await LoadConnectedBanksAsync(applicationId, ct);
        var bankingMetrics = await LoadBankingMetricsAsync(applicationId, ct);
        var bankingCompleteness = await LoadBankingCompletenessAsync(applicationId, ct);
        return Map(
            profile,
            integrations,
            isOpenBankingConnected,
            evidence,
            integrationMetrics,
            connectedBanks,
            bankingMetrics,
            bankingCompleteness);
    }

    /// <summary>
    /// Integration-owned bands cannot be edited via PUT. Acknowledge "Save and continue"
    /// by re-marking onboarding progress and returning the current profile unchanged.
    /// </summary>
    private async Task<FinancialProfileResponse> AcknowledgeLockedProfileAsync(
        Guid applicationId,
        FinancialProfile profile,
        CancellationToken ct)
    {
        var status = await _funding.IsFinancialStepCompleteAsync(applicationId, ct)
            ? StepStatus.Complete
            : StepStatus.InProgress;
        await _onboarding.MarkStepAsync(applicationId, OnboardingStep.Financial, status, ct);

        var integrations = await _funding.GetIntegrationStatusAsync(applicationId, ct);
        var isOpenBankingConnected = integrations.Any(i =>
            i.Provider == IntegrationProvider.OpenBanking && i.IsConnected);
        var evidence = await LoadEvidenceAsync(applicationId, ct);
        var integrationMetrics = await LoadIntegrationMetricsAsync(applicationId, ct);
        var connectedBanks = await LoadConnectedBanksAsync(applicationId, ct);
        var bankingMetrics = await LoadBankingMetricsAsync(applicationId, ct);
        var bankingCompleteness = await LoadBankingCompletenessAsync(applicationId, ct);
        return Map(
            profile,
            integrations,
            isOpenBankingConnected,
            evidence,
            integrationMetrics,
            connectedBanks,
            bankingMetrics,
            bankingCompleteness);
    }

    internal static void ApplyQuickBooksBands(FinancialProfile profile, QuickBooksFinancialSnapshot snapshot)
    {
        if (snapshot.AnnualRevenue is > 0m)
        {
            profile.AnnualRevenueBand = MapAnnualRevenue(snapshot.AnnualRevenue.Value);
            profile.AvgMonthlyRevenue = MapAvgMonthlyRevenue(snapshot.AnnualRevenue.Value / 12m);
        }
        else if (snapshot.CashBalance > 0m)
        {
            profile.AnnualRevenueBand = MapAnnualRevenue(snapshot.CashBalance * 12m);
            profile.AvgMonthlyRevenue = MapAvgMonthlyRevenue(snapshot.CashBalance);
        }

        profile.EbitdaBand = MapEbitdaBand(snapshot.AnnualRevenue, snapshot.NetIncome);

        var debtAmount = snapshot.OutstandingDebt > 0m
            ? snapshot.OutstandingDebt
            : snapshot.TotalLiabilities ?? 0m;
        profile.ExistingDebtBand = MapExistingDebt(debtAmount);
        profile.CashReserves = MapCashReservesMonths(snapshot.CashBalance);
        profile.BandsLockedByIntegration = true;
        profile.UpdatedAt = DateTime.UtcNow;
    }

    private static EbitdaMarginBand MapEbitdaBand(decimal? totalIncome, decimal? netIncome)
    {
        if (totalIncome is > 0m && netIncome.HasValue)
        {
            var margin = netIncome.Value / totalIncome.Value;
            return margin switch
            {
                < 0m => EbitdaMarginBand.LossMaking,
                < 0.05m => EbitdaMarginBand.Margin0To5,
                < 0.15m => EbitdaMarginBand.Margin5To15,
                < 0.30m => EbitdaMarginBand.Margin15To30,
                _ => EbitdaMarginBand.Over30Margin,
            };
        }

        return EbitdaMarginBand.Margin5To15;
    }

    private static ExistingDebtBand MapExistingDebt(decimal liabilities) => liabilities switch
    {
        <= 0m => ExistingDebtBand.NoDebt,
        < 50_000m => ExistingDebtBand.Under50K,
        < 250_000m => ExistingDebtBand.From50KTo250K,
        < 1_000_000m => ExistingDebtBand.From250KTo1M,
        _ => ExistingDebtBand.Over1M,
    };

    internal static void ApplyBankingMetricsBands(FinancialProfile profile, BankingIntegrationMetrics metrics)
    {
        if (metrics.AvgMonthlyInflow > 0m)
        {
            profile.AvgMonthlyRevenue = MapAvgMonthlyRevenue(metrics.AvgMonthlyInflow);
            profile.AnnualRevenueBand = MapAnnualRevenue(metrics.AvgMonthlyInflow * 12m);
        }

        if (metrics.TotalCashBalance > 0m)
        {
            profile.CashReserves = metrics.AvgMonthlyOutflow > 0m
                ? MapCashReservesMonths(metrics.TotalCashBalance / metrics.AvgMonthlyOutflow)
                : MapCashReservesMonths(metrics.TotalCashBalance);
        }

        profile.BandsLockedByIntegration = metrics.AccountCount > 0;
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

    private async Task<FinancialIntegrationMetricsDto?> LoadIntegrationMetricsAsync(
        Guid applicationId,
        CancellationToken ct)
    {
        var metrics = await _db.FinancialIntegrationMetrics
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.ApplicationId == applicationId, ct);

        return metrics is null ? null : FinancialIntegrationMetricsMapper.ToDto(metrics);
    }

    private async Task<IReadOnlyList<OpenBankingConnectionDto>> LoadConnectedBanksAsync(
        Guid applicationId,
        CancellationToken ct)
    {
        var connections = await _db.OpenBankingConnections
            .AsNoTracking()
            .Where(c => c.ApplicationId == applicationId)
            .OrderBy(c => c.ConnectedAt)
            .ToListAsync(ct);

        return connections
            .Select(c => BankingIntegrationMetricsMapper.ToConnectionDto(
                c,
                BankingIntegrationMetricsMapper.CountAccounts(c)))
            .ToList();
    }

    private async Task<BankingIntegrationMetricsDto?> LoadBankingMetricsAsync(
        Guid applicationId,
        CancellationToken ct)
    {
        var metrics = await _db.BankingIntegrationMetrics
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.ApplicationId == applicationId, ct);

        return metrics is null ? null : BankingIntegrationMetricsMapper.ToDto(metrics);
    }

    private async Task<BankingCompletenessAttestationDto?> LoadBankingCompletenessAsync(
        Guid applicationId,
        CancellationToken ct)
    {
        var attestation = await _db.BankingCompletenessAttestations
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.ApplicationId == applicationId, ct);

        return attestation is null
            ? null
            : new BankingCompletenessAttestationDto(
                attestation.AllRelevantAccountsConnected,
                attestation.AttestedAt,
                attestation.AttestedByUserId);
    }

    internal static async Task UpsertQuickBooksMetricsAsync(
        FundingDbContext db,
        Guid applicationId,
        QuickBooksFinancialSnapshot snapshot,
        CancellationToken ct)
    {
        var metrics = await db.FinancialIntegrationMetrics
            .FirstOrDefaultAsync(m => m.ApplicationId == applicationId, ct);

        var mapped = FinancialIntegrationMetricsMapper.FromQuickBooksSnapshot(applicationId, snapshot);
        if (metrics is null)
        {
            db.FinancialIntegrationMetrics.Add(mapped);
            return;
        }

        metrics.Provider = mapped.Provider;
        metrics.Currency = mapped.Currency;
        metrics.PeriodStart = mapped.PeriodStart;
        metrics.PeriodEnd = mapped.PeriodEnd;
        metrics.PriorPeriodEnd = mapped.PriorPeriodEnd;
        metrics.BalanceSheetAsOf = mapped.BalanceSheetAsOf;
        metrics.SyncedAt = mapped.SyncedAt;
        metrics.AnnualRevenue = mapped.AnnualRevenue;
        metrics.PriorAnnualRevenue = mapped.PriorAnnualRevenue;
        metrics.GrossProfit = mapped.GrossProfit;
        metrics.OperatingProfit = mapped.OperatingProfit;
        metrics.NetIncome = mapped.NetIncome;
        metrics.PriorNetIncome = mapped.PriorNetIncome;
        metrics.Ebitda = mapped.Ebitda;
        metrics.CashBalance = mapped.CashBalance;
        metrics.AccountsReceivable = mapped.AccountsReceivable;
        metrics.AccountsPayable = mapped.AccountsPayable;
        metrics.CurrentAssets = mapped.CurrentAssets;
        metrics.CurrentLiabilities = mapped.CurrentLiabilities;
        metrics.WorkingCapital = mapped.WorkingCapital;
        metrics.TotalAssets = mapped.TotalAssets;
        metrics.TotalLiabilities = mapped.TotalLiabilities;
        metrics.TotalEquity = mapped.TotalEquity;
        metrics.OutstandingDebt = mapped.OutstandingDebt;
        metrics.OperatingCashFlow = mapped.OperatingCashFlow;
        metrics.CurrentRatio = mapped.CurrentRatio;
        metrics.DebtToAssets = mapped.DebtToAssets;
        metrics.ProfitMargin = mapped.ProfitMargin;
        metrics.RevenueGrowthYoY = mapped.RevenueGrowthYoY;
        metrics.NetIncomeGrowthYoY = mapped.NetIncomeGrowthYoY;
        metrics.AccountCount = mapped.AccountCount;
        metrics.HasReportData = mapped.HasReportData;
        metrics.PriorPeriodHasReportData = mapped.PriorPeriodHasReportData;
    }

    private static FinancialProfileResponse Map(
        FinancialProfile profile,
        IReadOnlyList<IntegrationStatusDto> integrations,
        bool isOpenBankingConnected,
        IReadOnlyList<EvidenceResponse> evidence,
        FinancialIntegrationMetricsDto? integrationMetrics,
        IReadOnlyList<OpenBankingConnectionDto> connectedBanks,
        BankingIntegrationMetricsDto? bankingIntegrationMetrics,
        BankingCompletenessAttestationDto? bankingCompleteness) =>
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
            integrationMetrics,
            connectedBanks,
            bankingIntegrationMetrics,
            bankingCompleteness,
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
