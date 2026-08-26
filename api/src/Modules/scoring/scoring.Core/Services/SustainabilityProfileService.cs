using Microsoft.EntityFrameworkCore;
using onboarding.Contracts;
using scoring.Contracts;
using scoring.Core.Entities;
using scoring.Core.Persistence;

namespace scoring.Core.Services;

internal sealed class SustainabilityProfileService
{
    private readonly ScoringDbContext _db;
    private readonly IOnboardingModule _onboarding;
    private readonly IScoringModule _scoring;

    public SustainabilityProfileService(
        ScoringDbContext db,
        IOnboardingModule onboarding,
        IScoringModule scoring)
    {
        _db = db;
        _onboarding = onboarding;
        _scoring = scoring;
    }

    public async Task<SustainabilityProfileResponse?> GetAsync(Guid userId, CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct);
        if (applicationId is null)
            return null;

        var profile = await _db.SustainabilityProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.ApplicationId == applicationId, ct);

        return profile is null ? null : Map(profile);
    }

    public async Task<SustainabilityProfileResponse?> UpsertAsync(
        Guid userId,
        UpsertSustainabilityProfileRequest request,
        CancellationToken ct = default)
    {
        ValidateRequest(request);

        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct)
            ?? throw new InvalidOperationException("Draft application not found.");

        var profile = await _db.SustainabilityProfiles
            .FirstOrDefaultAsync(s => s.ApplicationId == applicationId, ct);

        profile ??= new SustainabilityProfile { ApplicationId = applicationId };

        profile.EnergyEfficiency = request.EnergyEfficiency;
        profile.WasteReduction = request.WasteReduction;
        profile.CarbonFootprint = request.CarbonFootprint;
        profile.SustainableSourcing = request.SustainableSourcing;
        profile.WaterConservation = request.WaterConservation;
        profile.EmployeeWellbeing = request.EmployeeWellbeing;
        profile.CommunityEngagement = request.CommunityEngagement;
        profile.EthicalGovernance = request.EthicalGovernance;
        profile.EnvironmentalCertification = request.EnvironmentalCertification;
        profile.UpdatedAt = DateTime.UtcNow;

        if (_db.Entry(profile).State == EntityState.Detached)
            _db.SustainabilityProfiles.Add(profile);

        await _db.SaveChangesAsync(ct);

        var status = await _scoring.IsStepCompleteAsync(applicationId, ct)
            ? StepStatus.Complete
            : StepStatus.InProgress;
        await _onboarding.MarkStepAsync(applicationId, OnboardingStep.Sustainability, status, ct);

        return Map(profile);
    }

    private static void ValidateRequest(UpsertSustainabilityProfileRequest request)
    {
        ValidateAnswer(request.EnergyEfficiency, nameof(request.EnergyEfficiency));
        ValidateAnswer(request.WasteReduction, nameof(request.WasteReduction));
        ValidateAnswer(request.CarbonFootprint, nameof(request.CarbonFootprint));
        ValidateAnswer(request.SustainableSourcing, nameof(request.SustainableSourcing));
        ValidateAnswer(request.WaterConservation, nameof(request.WaterConservation));
        ValidateAnswer(request.EmployeeWellbeing, nameof(request.EmployeeWellbeing));
        ValidateAnswer(request.CommunityEngagement, nameof(request.CommunityEngagement));
        ValidateAnswer(request.EthicalGovernance, nameof(request.EthicalGovernance));
        ValidateAnswer(request.EnvironmentalCertification, nameof(request.EnvironmentalCertification));
    }

    private static void ValidateAnswer(SustainabilityAnswer answer, string fieldName)
    {
        if (answer is SustainabilityAnswer.NotAnswered || !Enum.IsDefined(answer))
            throw new ArgumentException($"A valid answer is required for {fieldName}.");
    }

    private static SustainabilityProfileResponse Map(SustainabilityProfile profile) =>
        new(
            profile.ApplicationId,
            profile.EnergyEfficiency,
            profile.WasteReduction,
            profile.CarbonFootprint,
            profile.SustainableSourcing,
            profile.WaterConservation,
            profile.EmployeeWellbeing,
            profile.CommunityEngagement,
            profile.EthicalGovernance,
            profile.EnvironmentalCertification,
            profile.UpdatedAt);
}
