using Microsoft.EntityFrameworkCore;
using scoring.Contracts;
using scoring.Core.Persistence;

namespace scoring.Core;

internal sealed class ScoringModule : IScoringModule
{
    private readonly ScoringDbContext _db;

    public ScoringModule(ScoringDbContext db) => _db = db;

    public async Task<bool> IsStepCompleteAsync(Guid applicationId, CancellationToken ct = default)
    {
        var profile = await _db.SustainabilityProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.ApplicationId == applicationId, ct);

        if (profile is null)
            return false;

        return AllAnswered(profile.EnergyEfficiency)
            && AllAnswered(profile.WasteReduction)
            && AllAnswered(profile.CarbonFootprint)
            && AllAnswered(profile.SustainableSourcing)
            && AllAnswered(profile.WaterConservation)
            && AllAnswered(profile.EmployeeWellbeing)
            && AllAnswered(profile.CommunityEngagement)
            && AllAnswered(profile.EthicalGovernance)
            && AllAnswered(profile.EnvironmentalCertification);
    }

    private static bool AllAnswered(SustainabilityAnswer answer) =>
        answer is not SustainabilityAnswer.NotAnswered;
}
