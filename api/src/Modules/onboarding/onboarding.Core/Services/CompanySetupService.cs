using System.Text.RegularExpressions;
using juskel.Integrations.CompaniesHouse;
using Microsoft.EntityFrameworkCore;
using onboarding.Contracts;
using onboarding.Core.Entities;
using onboarding.Core.Persistence;

namespace onboarding.Core.Services;

internal sealed class CompanySetupService
{
    private static readonly Regex UkPostcodeRegex = new(
        @"^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly OnboardingDbContext _db;
    private readonly ICompaniesHouseClient _companiesHouse;
    private readonly IOnboardingModule _onboarding;

    public CompanySetupService(
        OnboardingDbContext db,
        ICompaniesHouseClient companiesHouse,
        IOnboardingModule onboarding)
    {
        _db = db;
        _companiesHouse = companiesHouse;
        _onboarding = onboarding;
    }

    public async Task<CompanySetupResponse?> GetAsync(Guid userId, CancellationToken ct = default)
    {
        var application = await GetDraftApplicationAsync(userId, ct);
        if (application?.CompanySetup is null)
            return null;

        return Map(application.Id, application.CompanySetup);
    }

    public async Task<CompanySetupResponse?> UpsertAsync(
        Guid userId,
        UpsertCompanySetupRequest request,
        CancellationToken ct = default)
    {
        var application = await GetDraftApplicationAsync(userId, ct)
            ?? throw new InvalidOperationException("Draft application not found.");

        ValidateRequest(request);

        var now = DateTime.UtcNow;
        var setup = application.CompanySetup ?? new CompanySetup { ApplicationId = application.Id };

        setup.LegalName = request.LegalName.Trim();
        setup.TradingName = string.IsNullOrWhiteSpace(request.TradingName) ? null : request.TradingName.Trim();
        setup.CompaniesHouseNumber = string.IsNullOrWhiteSpace(request.CompaniesHouseNumber)
            ? null
            : request.CompaniesHouseNumber.Trim().ToUpperInvariant();
        setup.Relationship = request.Relationship;
        setup.Region = request.Region;
        setup.RegisteredAddressLine1 = request.RegisteredAddressLine1.Trim();
        setup.RegisteredAddressLine2 = string.IsNullOrWhiteSpace(request.RegisteredAddressLine2)
            ? null
            : request.RegisteredAddressLine2.Trim();
        setup.City = request.City.Trim();
        setup.Postcode = request.Postcode.Trim().ToUpperInvariant();
        setup.EmployeeSizeBand = request.EmployeeSizeBand;
        setup.AnnualTurnoverBand = request.AnnualTurnoverBand;
        setup.YearsInOperationBand = request.YearsInOperationBand;
        setup.UpdatedAt = now;

        if (application.CompanySetup is null)
            _db.CompanySetups.Add(setup);

        application.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        await _onboarding.MarkStepAsync(application.Id, OnboardingStep.Company, StepStatus.Complete, ct);

        return Map(application.Id, setup);
    }

    public async Task<VerifyCompaniesHouseResponse?> VerifyAsync(
        Guid userId,
        VerifyCompaniesHouseRequest request,
        CancellationToken ct = default)
    {
        var application = await GetDraftApplicationAsync(userId, ct)
            ?? throw new InvalidOperationException("Draft application not found.");

        var companyNumber = request.CompanyNumber.Trim().ToUpperInvariant();
        var lookup = await _companiesHouse.LookupCompanyAsync(companyNumber, ct);

        if (lookup is null)
            return null;

        var setup = application.CompanySetup ?? new CompanySetup
        {
            ApplicationId = application.Id,
            LegalName = lookup.CompanyName,
        };

        setup.CompaniesHouseNumber = lookup.CompanyNumber;
        setup.LegalName = lookup.CompanyName;
        setup.IsCompaniesHouseVerified = lookup.IsActive;
        setup.UpdatedAt = DateTime.UtcNow;

        if (application.CompanySetup is null)
            _db.CompanySetups.Add(setup);

        application.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new VerifyCompaniesHouseResponse(
            lookup.CompanyNumber,
            lookup.CompanyName,
            lookup.Status,
            lookup.RegisteredOfficeAddress,
            lookup.IsActive,
            lookup.IsActive);
    }

    private async Task<Application?> GetDraftApplicationAsync(Guid userId, CancellationToken ct)
    {
        return await _db.Applications
            .Include(a => a.CompanySetup)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Status == SubmissionStatus.Draft, ct);
    }

    private static void ValidateRequest(UpsertCompanySetupRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.LegalName))
            throw new ArgumentException("Legal name is required.");

        if (string.IsNullOrWhiteSpace(request.RegisteredAddressLine1))
            throw new ArgumentException("Registered address line 1 is required.");

        if (string.IsNullOrWhiteSpace(request.City))
            throw new ArgumentException("City is required.");

        if (string.IsNullOrWhiteSpace(request.Postcode) || !UkPostcodeRegex.IsMatch(request.Postcode.Trim()))
            throw new ArgumentException("A valid UK postcode is required.");

        if (!Enum.IsDefined(request.Relationship))
            throw new ArgumentException("Invalid company relationship.");

        if (!Enum.IsDefined(request.Region))
            throw new ArgumentException("Invalid UK region.");
    }

    private static CompanySetupResponse Map(Guid applicationId, CompanySetup setup) =>
        new(
            applicationId,
            setup.LegalName,
            setup.TradingName,
            setup.CompaniesHouseNumber,
            setup.IsCompaniesHouseVerified,
            setup.Relationship,
            setup.Region,
            setup.RegisteredAddressLine1,
            setup.RegisteredAddressLine2,
            setup.City,
            setup.Postcode,
            setup.EmployeeSizeBand,
            setup.AnnualTurnoverBand,
            setup.YearsInOperationBand,
            setup.UpdatedAt);
}
