using funding.Contracts;
using Microsoft.EntityFrameworkCore;
using onboarding.Contracts;
using onboarding.Core.Entities;
using onboarding.Core.Persistence;
using scoring.Contracts;

namespace onboarding.Core.Services;

internal sealed class OnboardingApplicationService
{
    private const int TotalSteps = 5;
    private readonly OnboardingDbContext _db;
    private readonly IFundingModule _funding;
    private readonly IScoringModule _scoring;

    public OnboardingApplicationService(
        OnboardingDbContext db,
        IFundingModule funding,
        IScoringModule scoring)
    {
        _db = db;
        _funding = funding;
        _scoring = scoring;
    }

    public async Task<CreateApplicationResponse> CreateApplicationAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var existing = await _db.Applications
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Status == SubmissionStatus.Draft, ct);

        if (existing is not null)
            return new CreateApplicationResponse(existing.Id);

        var now = DateTime.UtcNow;
        var application = new Application
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Status = SubmissionStatus.Draft,
            CreatedAt = now,
            UpdatedAt = now,
            Steps = Enum.GetValues<OnboardingStep>()
                .Select(step => new StepProgress
                {
                    Step = step,
                    Status = StepStatus.NotStarted,
                    UpdatedAt = now,
                })
                .ToList(),
        };

        _db.Applications.Add(application);
        await _db.SaveChangesAsync(ct);

        return new CreateApplicationResponse(application.Id);
    }

    public async Task<ApplicationResponse?> GetCurrentApplicationAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var application = await _db.Applications
            .AsNoTracking()
            .Include(a => a.Steps)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync(ct);

        return application is null ? null : MapToResponse(application);
    }

    public async Task<SubmitApplicationResponse?> SubmitApplicationAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var application = await _db.Applications
            .Include(a => a.Steps)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Status == SubmissionStatus.Draft, ct);

        if (application is null)
            return null;

        var completedCount = application.Steps.Count(s => s.Status == StepStatus.Complete);
        if (completedCount != TotalSteps)
            throw new InvalidOperationException("All onboarding steps must be complete before submission.");

        var financialComplete = await _funding.IsFinancialStepCompleteAsync(application.Id, ct);
        var fundingComplete = await _funding.IsFundingStepCompleteAsync(application.Id, ct);
        var sustainabilityComplete = await _scoring.IsStepCompleteAsync(application.Id, ct);

        if (!financialComplete || !fundingComplete || !sustainabilityComplete)
            throw new InvalidOperationException("All onboarding steps must be complete before submission.");

        var now = DateTime.UtcNow;
        application.Status = SubmissionStatus.Submitted;
        application.SubmittedAt = now;
        application.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);

        return new SubmitApplicationResponse(application.Id, application.Status, now);
    }

    private static ApplicationResponse MapToResponse(Application application)
    {
        var steps = Enum.GetValues<OnboardingStep>()
            .Select(step =>
            {
                var progress = application.Steps.FirstOrDefault(s => s.Step == step);
                return new StepProgressDto(
                    step,
                    progress?.Status ?? StepStatus.NotStarted,
                    progress?.UpdatedAt);
            })
            .ToList();

        var completedCount = steps.Count(s => s.Status == StepStatus.Complete);

        return new ApplicationResponse(
            application.Id,
            application.Status,
            completedCount,
            TotalSteps,
            application.Status == SubmissionStatus.Draft && completedCount == TotalSteps,
            steps,
            application.CreatedAt,
            application.UpdatedAt,
            application.SubmittedAt);
    }
}
