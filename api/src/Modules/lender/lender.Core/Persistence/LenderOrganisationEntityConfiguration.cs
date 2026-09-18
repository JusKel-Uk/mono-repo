using lender.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace lender.Core.Persistence;

internal sealed class LenderOrganisationEntityConfiguration : IEntityTypeConfiguration<LenderOrganisation>
{
    public void Configure(EntityTypeBuilder<LenderOrganisation> entity)
    {
        entity.ToTable("LenderOrganisations");
        entity.HasKey(o => o.Id);
        entity.Property(o => o.Name).HasMaxLength(200).IsRequired();
        entity.Property(o => o.Website).HasMaxLength(500);
    }
}
