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

        profile.GhgEmissions = request.GhgEmissions;
        profile.SustainabilityPolicy = request.SustainabilityPolicy;
        profile.ResourceTracking = request.ResourceTracking;
        profile.Wellbeing = request.Wellbeing;
        profile.Training = request.Training;
        profile.Dei = request.Dei;
        profile.Continuity = request.Continuity;
        profile.GovernancePolicies = request.GovernancePolicies;
        profile.RiskReview = request.RiskReview;
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
        ValidateAnswer(request.GhgEmissions, nameof(request.GhgEmissions));
        ValidateAnswer(request.SustainabilityPolicy, nameof(request.SustainabilityPolicy));
        ValidateAnswer(request.ResourceTracking, nameof(request.ResourceTracking));
        ValidateAnswer(request.Wellbeing, nameof(request.Wellbeing));
        ValidateAnswer(request.Training, nameof(request.Training));
        ValidateAnswer(request.Dei, nameof(request.Dei));
        ValidateAnswer(request.Continuity, nameof(request.Continuity));
        ValidateAnswer(request.GovernancePolicies, nameof(request.GovernancePolicies));
        ValidateAnswer(request.RiskReview, nameof(request.RiskReview));
    }

    private static void ValidateAnswer(SustainabilityAnswer answer, string fieldName)
    {
        if (answer is SustainabilityAnswer.NotAnswered || !Enum.IsDefined(answer))
            throw new ArgumentException($"A valid answer is required for {fieldName}.");
    }

    private static SustainabilityProfileResponse Map(SustainabilityProfile profile) =>
        new(
            profile.ApplicationId,
            profile.GhgEmissions,
            profile.SustainabilityPolicy,
            profile.ResourceTracking,
            profile.Wellbeing,
            profile.Training,
            profile.Dei,
            profile.Continuity,
            profile.GovernancePolicies,
            profile.RiskReview,
            profile.UpdatedAt);
}
