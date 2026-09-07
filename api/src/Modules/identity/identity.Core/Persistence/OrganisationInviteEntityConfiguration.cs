using identity.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace identity.Core.Persistence;

internal sealed class OrganisationInviteEntityConfiguration : IEntityTypeConfiguration<OrganisationInvite>
{
    public void Configure(EntityTypeBuilder<OrganisationInvite> entity)
    {
        entity.ToTable("OrganisationInvites");
        entity.HasKey(i => i.Id);

        entity.Property(i => i.EmailLookupHash)
            .HasMaxLength(64)
            .IsRequired();

        entity.Property(i => i.TokenHash)
            .HasMaxLength(128)
            .IsRequired();

        entity.Property(i => i.Role).IsRequired();
        entity.Property(i => i.ExpiresAt).IsRequired();
        entity.Property(i => i.CreatedAt).IsRequired();

        entity.HasOne(i => i.Organisation)
            .WithMany(o => o.Invites)
            .HasForeignKey(i => i.OrganisationId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasIndex(i => i.TokenHash).IsUnique();
        entity.HasIndex(i => new { i.OrganisationId, i.EmailLookupHash });
    }
}
