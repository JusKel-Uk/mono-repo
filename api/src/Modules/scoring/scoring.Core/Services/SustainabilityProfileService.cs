using Microsoft.EntityFrameworkCore;
using notifications.Contracts;
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
    private readonly INotificationModule _notifications;

    public SustainabilityProfileService(
        ScoringDbContext db,
        IOnboardingModule onboarding,
        IScoringModule scoring,
        INotificationModule notifications)
    {
        _db = db;
        _onboarding = onboarding;
        _scoring = scoring;
        _notifications = notifications;
    }

    public async Task<SustainabilityProfileResponse?> GetAsync(Guid organisationId, CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetCurrentApplicationIdAsync(organisationId, ct);
        if (applicationId is null)
            return null;

        var profile = await _db.SustainabilityProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.ApplicationId == applicationId, ct);

        var evidence = await LoadEvidenceAsync(applicationId.Value, ct);

        if (profile is null && evidence.Count == 0)
            return null;

        profile ??= new SustainabilityProfile
        {
            ApplicationId = applicationId.Value,
            UpdatedAt = DateTime.UtcNow,
        };

        return Map(profile, evidence);
    }

    public async Task<SustainabilityProfileResponse?> UpsertAsync(
        Guid userId,
        Guid organisationId,
        UpsertSustainabilityProfileRequest request,
        CancellationToken ct = default)
    {
        ValidateRequest(request);

        var applicationId = await _onboarding.GetDraftApplicationIdAsync(organisationId, ct)
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

        if (status == StepStatus.Complete)
        {
            await _notifications.NotifyAsync(
                ProductNotifications.AssessmentProgress(
                    userId,
                    organisationId,
                    "Sustainability profile complete",
                    "You've finished filling the sustainability questionnaire. Great work.",
                    "/sme/assessment"),
                ct);
        }

        var evidence = await LoadEvidenceAsync(applicationId, ct);
        return Map(profile, evidence);
    }

    private async Task<IReadOnlyList<SustainabilityEvidenceResponse>> LoadEvidenceAsync(
        Guid applicationId,
        CancellationToken ct) =>
        await _db.SustainabilityEvidence
            .AsNoTracking()
            .Where(e => e.ApplicationId == applicationId)
            .OrderBy(e => e.QuestionKey)
            .Select(e => new SustainabilityEvidenceResponse(
                e.Id,
                e.ApplicationId,
                e.QuestionKey,
                e.FileName,
                e.ContentType,
                e.FileSizeBytes,
                e.UploadedAt))
            .ToListAsync(ct);

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

    private static SustainabilityProfileResponse Map(
        SustainabilityProfile profile,
        IReadOnlyList<SustainabilityEvidenceResponse> evidence) =>
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
            evidence,
            profile.UpdatedAt);
}
