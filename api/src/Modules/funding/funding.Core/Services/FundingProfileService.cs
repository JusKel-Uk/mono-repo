using funding.Contracts;
using funding.Core.Entities;
using funding.Core.Persistence;
using Microsoft.EntityFrameworkCore;
using onboarding.Contracts;

namespace funding.Core.Services;

internal sealed class FundingProfileService
{
    private readonly FundingDbContext _db;
    private readonly IOnboardingModule _onboarding;
    private readonly IFundingModule _funding;

    public FundingProfileService(
        FundingDbContext db,
        IOnboardingModule onboarding,
        IFundingModule funding)
    {
        _db = db;
        _onboarding = onboarding;
        _funding = funding;
    }

    public async Task<FundingProfileResponse?> GetAsync(Guid userId, CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetCurrentApplicationIdAsync(userId, ct);
        if (applicationId is null)
            return null;

        var profile = await _db.FundingProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);

        return profile is null ? null : Map(profile);
    }

    public async Task<FundingProfileResponse?> UpsertAsync(
        Guid userId,
        UpsertFundingProfileRequest request,
        CancellationToken ct = default)
    {
        if (request.RequestedAmount <= 0m)
            throw new ArgumentException("Requested amount must be greater than zero.");

        if (request.TermMonths <= 0)
            throw new ArgumentException("Term months must be greater than zero.");

        if (!Enum.IsDefined(request.Purpose))
            throw new ArgumentException("Funding purpose is required.");

        if (!Enum.IsDefined(request.Urgency))
            throw new ArgumentException("Funding urgency is required.");

        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct)
            ?? throw new InvalidOperationException("Draft application not found.");

        var profile = await _db.FundingProfiles
            .FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);

        profile ??= new FundingProfile { ApplicationId = applicationId };

        profile.RequestedAmount = request.RequestedAmount;
        profile.Purpose = request.Purpose;
        profile.TermMonths = request.TermMonths;
        profile.Urgency = request.Urgency;
        profile.UpdatedAt = DateTime.UtcNow;

        if (_db.Entry(profile).State == EntityState.Detached)
            _db.FundingProfiles.Add(profile);

        await _db.SaveChangesAsync(ct);

        var status = await _funding.IsFundingStepCompleteAsync(applicationId, ct)
            ? StepStatus.Complete
            : StepStatus.InProgress;
        await _onboarding.MarkStepAsync(applicationId, OnboardingStep.Funding, status, ct);

        return Map(profile);
    }

    private static FundingProfileResponse Map(FundingProfile profile) =>
        new(
            profile.ApplicationId,
            profile.RequestedAmount,
            profile.Purpose,
            profile.TermMonths,
            profile.Urgency,
            profile.UpdatedAt);
}
