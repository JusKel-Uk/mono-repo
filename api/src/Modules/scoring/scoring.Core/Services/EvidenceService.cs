using juskel.Integrations.BlobStorage;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using onboarding.Contracts;
using scoring.Contracts;
using scoring.Core.Entities;
using scoring.Core.Persistence;

namespace scoring.Core.Services;

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

    private readonly ScoringDbContext _db;
    private readonly IOnboardingModule _onboarding;
    private readonly IBlobStorage _blobStorage;

    public EvidenceService(
        ScoringDbContext db,
        IOnboardingModule onboarding,
        IBlobStorage blobStorage)
    {
        _db = db;
        _onboarding = onboarding;
        _blobStorage = blobStorage;
    }

    public async Task<SustainabilityEvidenceResponse?> UploadAsync(
        Guid userId,
        SustainabilityQuestionKey questionKey,
        IFormFile file,
        CancellationToken ct = default)
    {
        ValidateFile(file);

        if (!Enum.IsDefined(questionKey))
            throw new ArgumentException("Question key is required.");

        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct)
            ?? throw new InvalidOperationException("Draft application not found.");

        var evidenceId = Guid.NewGuid();
        var blobPath = $"scoring/{applicationId}/{questionKey}/{evidenceId}/{SanitizeFileName(file.FileName)}";

        await using var stream = file.OpenReadStream();
        await _blobStorage.UploadAsync(blobPath, stream, file.ContentType, ct);

        var existing = await _db.SustainabilityEvidence
            .FirstOrDefaultAsync(e => e.ApplicationId == applicationId && e.QuestionKey == questionKey, ct);

        if (existing is not null)
        {
            await _blobStorage.DeleteAsync(existing.BlobPath, ct);
            _db.SustainabilityEvidence.Remove(existing);
        }

        var evidence = new SustainabilityEvidence
        {
            Id = evidenceId,
            ApplicationId = applicationId,
            QuestionKey = questionKey,
            FileName = file.FileName,
            ContentType = file.ContentType,
            BlobPath = blobPath,
            FileSizeBytes = file.Length,
            UploadedAt = DateTime.UtcNow,
        };

        _db.SustainabilityEvidence.Add(evidence);
        await _db.SaveChangesAsync(ct);

        return new SustainabilityEvidenceResponse(
            evidence.Id,
            evidence.ApplicationId,
            evidence.QuestionKey,
            evidence.FileName,
            evidence.ContentType,
            evidence.FileSizeBytes,
            evidence.UploadedAt);
    }

    public async Task<bool> DeleteAsync(
        Guid userId,
        Guid evidenceId,
        CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct);
        if (applicationId is null)
            return false;

        var evidence = await _db.SustainabilityEvidence
            .FirstOrDefaultAsync(e => e.Id == evidenceId && e.ApplicationId == applicationId, ct);

        if (evidence is null)
            return false;

        await _blobStorage.DeleteAsync(evidence.BlobPath, ct);
        _db.SustainabilityEvidence.Remove(evidence);
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
