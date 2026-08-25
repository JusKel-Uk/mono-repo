using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using onboarding.Core.Entities;

namespace onboarding.Core.Persistence;

internal sealed class CompanySetupEntityConfiguration : IEntityTypeConfiguration<CompanySetup>
{
    public void Configure(EntityTypeBuilder<CompanySetup> entity)
    {
        entity.ToTable("CompanySetups");
        entity.HasKey(c => c.ApplicationId);

        entity.Property(c => c.LegalName).HasMaxLength(200).IsRequired();
        entity.Property(c => c.TradingName).HasMaxLength(200);
        entity.Property(c => c.CompaniesHouseNumber).HasMaxLength(20);
        entity.Property(c => c.RegisteredAddressLine1).HasMaxLength(200).IsRequired();
        entity.Property(c => c.RegisteredAddressLine2).HasMaxLength(200);
        entity.Property(c => c.City).HasMaxLength(100).IsRequired();
        entity.Property(c => c.Postcode).HasMaxLength(20).IsRequired();
        entity.Property(c => c.UpdatedAt).IsRequired();

        entity.HasOne(c => c.Application)
            .WithOne(a => a.CompanySetup)
            .HasForeignKey<CompanySetup>(c => c.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
