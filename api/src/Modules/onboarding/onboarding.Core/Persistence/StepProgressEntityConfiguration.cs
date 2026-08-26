using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using onboarding.Core.Entities;

namespace onboarding.Core.Persistence;

internal sealed class StepProgressEntityConfiguration : IEntityTypeConfiguration<StepProgress>
{
    public void Configure(EntityTypeBuilder<StepProgress> entity)
    {
        entity.ToTable("StepProgress");

        // Composite primary key: one row per step per application
        entity.HasKey(s => new { s.ApplicationId, s.Step });

        entity.Property(s => s.Status).IsRequired();
    }
}