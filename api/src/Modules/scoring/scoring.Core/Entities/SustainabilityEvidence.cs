using scoring.Contracts;

namespace scoring.Core.Entities;

internal sealed class SustainabilityEvidence
{
    public Guid Id { get; set; }

    public Guid ApplicationId { get; set; }

    public SustainabilityQuestionKey QuestionKey { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public string BlobPath { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public DateTime UploadedAt { get; set; }
}
