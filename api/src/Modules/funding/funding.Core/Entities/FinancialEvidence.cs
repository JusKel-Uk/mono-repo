namespace funding.Core.Entities;

internal sealed class FinancialEvidence
{
    public Guid Id { get; set; }

    public Guid ApplicationId { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public string BlobPath { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public DateTime UploadedAt { get; set; }
}
