using funding.Contracts;
using funding.Core.Persistence;
using Microsoft.EntityFrameworkCore;
using onboarding.Contracts;

namespace funding.Core;

internal sealed class FundingModule : IFundingModule
{
    private readonly FundingDbContext _db;

    public FundingModule(FundingDbContext db) => _db = db;

    public async Task<bool> IsFinancialStepCompleteAsync(Guid applicationId, CancellationToken ct = default)
    {
        var profile = await _db.FinancialProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);

        if (profile is null)
            return false;

        var openBankingConnected = await _db.IntegrationConnections
            .AsNoTracking()
            .AnyAsync(i => i.ApplicationId == applicationId && i.Provider == IntegrationProvider.OpenBanking, ct);

        if (openBankingConnected)
            return true;

        return profile.AnnualRevenueBand.HasValue
            && profile.EbitdaBand.HasValue
            && profile.ExistingDebtBand.HasValue
            && profile.CashReserves.HasValue
            && profile.AvgMonthlyRevenue.HasValue;
    }

    public async Task<bool> IsFundingStepCompleteAsync(Guid applicationId, CancellationToken ct = default)
    {
        var profile = await _db.FundingProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);

        return profile is not null
            && profile.RequestedAmount > 0m
            && profile.TermMonths > 0
            && Enum.IsDefined(profile.Purpose)
            && Enum.IsDefined(profile.Urgency);
    }

    public async Task<IReadOnlyList<IntegrationStatusDto>> GetIntegrationStatusAsync(
        Guid applicationId,
        CancellationToken ct = default)
    {
        var connections = await _db.IntegrationConnections
            .AsNoTracking()
            .Where(i => i.ApplicationId == applicationId)
            .ToListAsync(ct);

        return Enum.GetValues<IntegrationProvider>()
            .Select(provider =>
            {
                var connection = connections.FirstOrDefault(c => c.Provider == provider);
                return new IntegrationStatusDto(
                    provider,
                    connection is not null,
                    connection?.ConnectedAt,
                    connection?.ExpiresAt);
            })
            .ToList();
    }
}
