using identity.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace identity.Core.Persistence;

internal sealed class OrganisationEntityConfiguration : IEntityTypeConfiguration<Organisation>
{
    public void Configure(EntityTypeBuilder<Organisation> entity)
    {
        entity.ToTable("Organisations");
        entity.HasKey(o => o.Id);

        entity.Property(o => o.Name)
            .HasMaxLength(200)
            .IsRequired();

        entity.Property(o => o.EmailDomain)
            .HasMaxLength(253)
            .IsRequired();

        entity.Property(o => o.CreatedAt).IsRequired();
        entity.Property(o => o.UpdatedAt).IsRequired();
    }
}
