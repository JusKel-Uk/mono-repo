using funding.Contracts;
using funding.Core.Entities;
using funding.Core.Persistence;
using juskel.Integrations.BlobStorage;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using onboarding.Contracts;

namespace funding.Core.Services;

internal sealed class EvidenceService
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
    };

    private readonly FundingDbContext _db;
    private readonly IOnboardingModule _onboarding;
    private readonly IBlobStorage _blobStorage;

    public EvidenceService(
        FundingDbContext db,
        IOnboardingModule onboarding,
        IBlobStorage blobStorage)
    {
        _db = db;
        _onboarding = onboarding;
        _blobStorage = blobStorage;
    }

    public async Task<IReadOnlyList<EvidenceResponse>> ListAsync(Guid userId, CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct);
        if (applicationId is null)
            return [];

        return await _db.FinancialEvidence
            .AsNoTracking()
            .Where(e => e.ApplicationId == applicationId)
            .OrderByDescending(e => e.UploadedAt)
            .Select(e => new EvidenceResponse(
                e.Id,
                e.ApplicationId,
                e.FileName,
                e.ContentType,
                e.FileSizeBytes,
                e.UploadedAt))
            .ToListAsync(ct);
    }

    public async Task<EvidenceResponse?> UploadAsync(
        Guid userId,
        IFormFile file,
        CancellationToken ct = default)
    {
        ValidateFile(file);

        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct)
            ?? throw new InvalidOperationException("Draft application not found.");

        var evidenceId = Guid.NewGuid();
        var blobPath = $"funding/{applicationId}/{evidenceId}/{SanitizeFileName(file.FileName)}";

        await using var stream = file.OpenReadStream();
        await _blobStorage.UploadAsync(blobPath, stream, file.ContentType, ct);

        var evidence = new FinancialEvidence
        {
            Id = evidenceId,
            ApplicationId = applicationId,
            FileName = file.FileName,
            ContentType = file.ContentType,
            BlobPath = blobPath,
            FileSizeBytes = file.Length,
            UploadedAt = DateTime.UtcNow,
        };

        _db.FinancialEvidence.Add(evidence);
        await _db.SaveChangesAsync(ct);

        return new EvidenceResponse(
            evidence.Id,
            evidence.ApplicationId,
            evidence.FileName,
            evidence.ContentType,
            evidence.FileSizeBytes,
            evidence.UploadedAt);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid evidenceId, CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct);
        if (applicationId is null)
            return false;

        var evidence = await _db.FinancialEvidence
            .FirstOrDefaultAsync(e => e.Id == evidenceId && e.ApplicationId == applicationId, ct);

        if (evidence is null)
            return false;

        await _blobStorage.DeleteAsync(evidence.BlobPath, ct);
        _db.FinancialEvidence.Remove(evidence);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static void ValidateFile(IFormFile file)
    {
        if (file.Length <= 0)
            throw new ArgumentException("File is empty.");

        if (file.Length > MaxFileSizeBytes)
            throw new ArgumentException("File exceeds the 10 MB limit.");

        if (!AllowedContentTypes.Contains(file.ContentType))
            throw new ArgumentException("Unsupported file type.");
    }

    private static string SanitizeFileName(string fileName) =>
        Path.GetFileName(fileName).Replace(' ', '-');
}
