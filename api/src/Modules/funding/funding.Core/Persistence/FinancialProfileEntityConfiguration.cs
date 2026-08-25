using funding.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace funding.Core.Persistence;

internal sealed class FinancialProfileEntityConfiguration : IEntityTypeConfiguration<FinancialProfile>
{
    public void Configure(EntityTypeBuilder<FinancialProfile> entity)
    {
        entity.ToTable("FinancialProfiles");
        entity.HasKey(f => f.ApplicationId);
        entity.Property(f => f.UpdatedAt).IsRequired();
    }
}

internal sealed class FundingProfileEntityConfiguration : IEntityTypeConfiguration<FundingProfile>
{
    public void Configure(EntityTypeBuilder<FundingProfile> entity)
    {
        entity.ToTable("FundingProfiles");
        entity.HasKey(f => f.ApplicationId);
        entity.Property(f => f.RequestedAmount).HasPrecision(18, 2).IsRequired();
        entity.Property(f => f.TermMonths).IsRequired();
        entity.Property(f => f.UpdatedAt).IsRequired();
    }
}

internal sealed class IntegrationConnectionEntityConfiguration : IEntityTypeConfiguration<IntegrationConnection>
{
    public void Configure(EntityTypeBuilder<IntegrationConnection> entity)
    {
        entity.ToTable("IntegrationConnections");
        entity.HasKey(i => i.Id);
        entity.Property(i => i.AccessTokenEncrypted).HasMaxLength(4000).IsRequired();
        entity.Property(i => i.RefreshTokenEncrypted).HasMaxLength(4000);
        entity.HasIndex(i => new { i.ApplicationId, i.Provider }).IsUnique();
    }
}

internal sealed class FinancialEvidenceEntityConfiguration : IEntityTypeConfiguration<FinancialEvidence>
{
    public void Configure(EntityTypeBuilder<FinancialEvidence> entity)
    {
        entity.ToTable("FinancialEvidence");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.FileName).HasMaxLength(255).IsRequired();
        entity.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
        entity.Property(e => e.BlobPath).HasMaxLength(500).IsRequired();
        entity.Property(e => e.UploadedAt).IsRequired();
    }
}
