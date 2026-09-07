using identity.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace identity.Core.Persistence;

internal sealed class OrganisationMemberEntityConfiguration : IEntityTypeConfiguration<OrganisationMember>
{
    public void Configure(EntityTypeBuilder<OrganisationMember> entity)
    {
        entity.ToTable("OrganisationMembers");
        entity.HasKey(m => new { m.OrganisationId, m.UserId });

        entity.Property(m => m.Role).IsRequired();
        entity.Property(m => m.JoinedAt).IsRequired();

        entity.HasOne(m => m.Organisation)
            .WithMany(o => o.Members)
            .HasForeignKey(m => m.OrganisationId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasIndex(m => m.UserId);
    }
}
