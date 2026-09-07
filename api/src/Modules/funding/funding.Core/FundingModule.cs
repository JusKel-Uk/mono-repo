using funding.Contracts;
using funding.Core.Persistence;
using Microsoft.EntityFrameworkCore;

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

        var hasOpenBanking = await _db.OpenBankingConnections
            .AsNoTracking()
            .AnyAsync(c => c.ApplicationId == applicationId, ct);

        if (hasOpenBanking)
        {
            var attestation = await _db.BankingCompletenessAttestations
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.ApplicationId == applicationId, ct);

            return profile.BandsLockedByIntegration
                && attestation is not null
                && attestation.AllRelevantAccountsConnected;
        }

        var quickBooksConnected = await _db.IntegrationConnections
            .AsNoTracking()
            .AnyAsync(
                i => i.ApplicationId == applicationId && i.Provider == IntegrationProvider.QuickBooks,
                ct);

        if (quickBooksConnected && profile.BandsLockedByIntegration)
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

        var openBankingConnections = await _db.OpenBankingConnections
            .AsNoTracking()
            .Where(c => c.ApplicationId == applicationId)
            .OrderBy(c => c.ConnectedAt)
            .ToListAsync(ct);

        return Enum.GetValues<IntegrationProvider>()
            .Select(provider =>
            {
                if (provider == IntegrationProvider.OpenBanking)
                {
                    var earliest = openBankingConnections.FirstOrDefault();
                    return new IntegrationStatusDto(
                        provider,
                        openBankingConnections.Count > 0,
                        earliest?.ConnectedAt,
                        openBankingConnections.MinBy(c => c.ExpiresAt ?? DateTime.MaxValue)?.ExpiresAt);
                }

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
