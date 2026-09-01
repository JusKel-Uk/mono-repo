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
        var application = await GetCurrentApplicationAsync(userId, ct);
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
        setup.CompaniesHouseNumber = string.IsNullOrWhiteSpace(request.CompaniesHouseNumber)
            ? null
            : request.CompaniesHouseNumber.Trim().ToUpperInvariant();
        setup.Relationship = request.Relationship;
        setup.Region = request.Region;
        setup.RegisteredAddressLine1 = request.RegisteredAddress.Trim();
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

        if (!string.IsNullOrWhiteSpace(lookup.RegisteredOfficeAddress))
        {
            var parsed = ParseUkAddress(lookup.RegisteredOfficeAddress);
            setup.RegisteredAddressLine1 = parsed.Line1;
            if (!string.IsNullOrWhiteSpace(parsed.City))
                setup.City = parsed.City;
            if (!string.IsNullOrWhiteSpace(parsed.Postcode))
                setup.Postcode = parsed.Postcode.ToUpperInvariant();
        }

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

    private async Task<Application?> GetCurrentApplicationAsync(Guid userId, CancellationToken ct)
    {
        return await _db.Applications
            .Include(a => a.CompanySetup)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync(ct);
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

        if (string.IsNullOrWhiteSpace(request.RegisteredAddress))
            throw new ArgumentException("Registered address is required.");

        if (string.IsNullOrWhiteSpace(request.City))
            throw new ArgumentException("City is required.");

        if (string.IsNullOrWhiteSpace(request.Postcode) || !UkPostcodeRegex.IsMatch(request.Postcode.Trim()))
            throw new ArgumentException("A valid UK postcode is required.");

        if (!Enum.IsDefined(request.Relationship))
            throw new ArgumentException("Invalid company relationship.");

        if (!Enum.IsDefined(request.Region))
            throw new ArgumentException("Invalid UK region.");
    }

    internal static (string Line1, string City, string Postcode) ParseUkAddress(string full)
    {
        var parts = full
            .Split(',')
            .Select(static s => s.Trim())
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .ToList();

        var postcode = string.Empty;
        if (parts.Count > 0 && UkPostcodeRegex.IsMatch(parts[^1]))
            postcode = parts[^1];

        if (!string.IsNullOrEmpty(postcode))
            parts.RemoveAt(parts.Count - 1);

        var city = parts.Count > 0 ? parts[^1] : string.Empty;
        var line1 = parts.Count > 1
            ? string.Join(", ", parts.Take(parts.Count - 1))
            : city.Length > 0 ? city : full;

        return (line1.Length > 0 ? line1 : full, city, postcode);
    }

    private static CompanySetupResponse Map(Guid applicationId, CompanySetup setup) =>
        new(
            applicationId,
            setup.LegalName,
            setup.CompaniesHouseNumber,
            setup.IsCompaniesHouseVerified,
            setup.Relationship,
            setup.Region,
            setup.RegisteredAddressLine1,
            setup.City,
            setup.Postcode,
            setup.EmployeeSizeBand,
            setup.AnnualTurnoverBand,
            setup.YearsInOperationBand,
            setup.UpdatedAt);
}
