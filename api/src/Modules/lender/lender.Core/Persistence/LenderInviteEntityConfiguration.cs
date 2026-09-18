using lender.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace lender.Core.Persistence;

internal sealed class LenderInviteEntityConfiguration : IEntityTypeConfiguration<LenderInvite>
{
    public void Configure(EntityTypeBuilder<LenderInvite> entity)
    {
        entity.ToTable("LenderInvites");
        entity.HasKey(i => i.Id);

        entity.Property(i => i.EmailLookupHash).HasMaxLength(64).IsRequired();
        entity.Property(i => i.TokenHash).HasMaxLength(128).IsRequired();
        entity.HasIndex(i => i.TokenHash).IsUnique();

        entity.HasOne(i => i.AccessRequest)
            .WithMany()
            .HasForeignKey(i => i.AccessRequestId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(i => i.LenderOrganisation)
            .WithMany(o => o.Invites)
            .HasForeignKey(i => i.LenderOrganisationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
