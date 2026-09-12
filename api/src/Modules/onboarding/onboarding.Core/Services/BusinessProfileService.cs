using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using notifications.Contracts;
using onboarding.Contracts;
using onboarding.Core.Entities;
using onboarding.Core.Persistence;

namespace onboarding.Core.Services;

internal sealed class BusinessProfileService
{
    private static readonly Regex UkPostcodeRegex = new(
        @"^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly OnboardingDbContext _db;
    private readonly IOnboardingModule _onboarding;
    private readonly INotificationModule _notifications;

    public BusinessProfileService(
        OnboardingDbContext db,
        IOnboardingModule onboarding,
        INotificationModule notifications)
    {
        _db = db;
        _onboarding = onboarding;
        _notifications = notifications;
    }

    public async Task<BusinessProfileResponse?> GetAsync(Guid organisationId, CancellationToken ct = default)
    {
        var application = await GetCurrentApplicationAsync(organisationId, ct);
        if (application?.BusinessProfile is null)
            return null;

        return Map(application.Id, application.BusinessProfile);
    }

    public async Task<BusinessProfileResponse?> UpsertAsync(
        Guid userId,
        Guid organisationId,
        UpsertBusinessProfileRequest request,
        CancellationToken ct = default)
    {
        var application = await GetDraftApplicationAsync(organisationId, ct)
            ?? throw new InvalidOperationException("Draft application not found.");

        ValidateRequest(request);

        var now = DateTime.UtcNow;
        var profile = application.BusinessProfile ?? new BusinessProfile { ApplicationId = application.Id };

        profile.Sector = request.Sector;
        profile.SubSector = string.IsNullOrWhiteSpace(request.SubSector) ? null : request.SubSector.Trim();
        profile.Region = request.Region;
        profile.EmployeeSizeBand = request.EmployeeSizeBand;
        profile.AnnualTurnoverBand = request.AnnualTurnoverBand;
        profile.YearsInOperationBand = request.YearsInOperationBand;
        profile.City = request.City.Trim();
        profile.Postcode = request.Postcode.Trim().ToUpperInvariant();
        profile.Description = request.Description.Trim();
        profile.UpdatedAt = now;

        if (application.BusinessProfile is null)
            _db.BusinessProfiles.Add(profile);

        application.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        await _onboarding.MarkStepAsync(application.Id, OnboardingStep.Business, StepStatus.Complete, ct);

        await _notifications.NotifyAsync(
            ProductNotifications.AssessmentProgress(
                userId,
                organisationId,
                "Business profile complete",
                "You've finished filling the business profile. Great work.",
                "/sme/assessment"),
            ct);

        return Map(application.Id, profile);
    }

    private async Task<Application?> GetCurrentApplicationAsync(Guid organisationId, CancellationToken ct)
    {
        return await _db.Applications
            .Include(a => a.BusinessProfile)
            .Where(a => a.OrganisationId == organisationId)
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync(ct);
    }

    private async Task<Application?> GetDraftApplicationAsync(Guid organisationId, CancellationToken ct)
    {
        return await _db.Applications
            .Include(a => a.BusinessProfile)
            .FirstOrDefaultAsync(
                a => a.OrganisationId == organisationId && a.Status == SubmissionStatus.Draft,
                ct);
    }

    private static void ValidateRequest(UpsertBusinessProfileRequest request)
    {
        if (!Enum.IsDefined(request.Sector))
            throw new ArgumentException("Business sector is required.");

        if (string.IsNullOrWhiteSpace(request.City))
            throw new ArgumentException("City is required.");

        if (string.IsNullOrWhiteSpace(request.Postcode) || !UkPostcodeRegex.IsMatch(request.Postcode.Trim()))
            throw new ArgumentException("A valid UK postcode is required.");

        if (string.IsNullOrWhiteSpace(request.Description))
            throw new ArgumentException("Business description is required.");
    }

    private static BusinessProfileResponse Map(Guid applicationId, BusinessProfile profile) =>
        new(
            applicationId,
            profile.Sector,
            profile.SubSector,
            profile.Region,
            profile.EmployeeSizeBand,
            profile.AnnualTurnoverBand,
            profile.YearsInOperationBand,
            profile.City,
            profile.Postcode,
            profile.Description,
            profile.UpdatedAt);
}
