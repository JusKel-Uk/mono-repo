using Microsoft.EntityFrameworkCore;
using onboarding.Contracts;
using onboarding.Core.Persistence;

namespace onboarding.Core;

internal sealed class OnboardingModule : IOnboardingModule
{
    private readonly OnboardingDbContext _db;

    public OnboardingModule(OnboardingDbContext db) => _db = db;

    public async Task<Guid?> GetDraftApplicationIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.Applications
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.Status == SubmissionStatus.Draft)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => (Guid?)a.Id)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<Guid?> GetCurrentApplicationIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.Applications
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => (Guid?)a.Id)
            .FirstOrDefaultAsync(ct);
    }

    public async Task MarkStepAsync(
        Guid applicationId,
        OnboardingStep step,
        StepStatus status,
        CancellationToken ct = default)
    {
        var progress = await _db.StepProgress
            .FirstOrDefaultAsync(s => s.ApplicationId == applicationId && s.Step == step, ct);

        if (progress is null)
            return;

        progress.Status = status;
        progress.UpdatedAt = DateTime.UtcNow;

        var application = await _db.Applications.FirstOrDefaultAsync(a => a.Id == applicationId, ct);
        if (application is not null)
            application.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}
