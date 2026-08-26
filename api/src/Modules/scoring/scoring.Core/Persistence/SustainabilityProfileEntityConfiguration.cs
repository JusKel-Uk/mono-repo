using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using scoring.Core.Entities;

namespace scoring.Core.Persistence;

internal sealed class SustainabilityProfileEntityConfiguration : IEntityTypeConfiguration<SustainabilityProfile>
{
    public void Configure(EntityTypeBuilder<SustainabilityProfile> entity)
    {
        entity.ToTable("SustainabilityProfiles");
        entity.HasKey(s => s.ApplicationId);
        entity.Property(s => s.UpdatedAt).IsRequired();
    }
}

internal sealed class SustainabilityEvidenceEntityConfiguration : IEntityTypeConfiguration<SustainabilityEvidence>
{
    public void Configure(EntityTypeBuilder<SustainabilityEvidence> entity)
    {
        entity.ToTable("SustainabilityEvidence");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.FileName).HasMaxLength(255).IsRequired();
        entity.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
        entity.Property(e => e.BlobPath).HasMaxLength(500).IsRequired();
        entity.Property(e => e.UploadedAt).IsRequired();
        entity.HasIndex(e => new { e.ApplicationId, e.QuestionKey });
    }
}
