using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using onboarding.Core.Entities;

namespace onboarding.Core.Persistence;

internal sealed class BusinessProfileEntityConfiguration : IEntityTypeConfiguration<BusinessProfile>
{
    public void Configure(EntityTypeBuilder<BusinessProfile> entity)
    {
        entity.ToTable("BusinessProfiles");
        entity.HasKey(b => b.ApplicationId);

        entity.Property(b => b.City).HasMaxLength(100).IsRequired();
        entity.Property(b => b.Postcode).HasMaxLength(20).IsRequired();
        entity.Property(b => b.Description).HasMaxLength(2000).IsRequired();
        entity.Property(b => b.UpdatedAt).IsRequired();

        entity.HasOne(b => b.Application)
            .WithOne(a => a.BusinessProfile)
            .HasForeignKey<BusinessProfile>(b => b.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
