using lender.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace lender.Core.Persistence;

internal sealed class LenderMemberEntityConfiguration : IEntityTypeConfiguration<LenderMember>
{
    public void Configure(EntityTypeBuilder<LenderMember> entity)
    {
        entity.ToTable("LenderMembers");
        entity.HasKey(m => new { m.LenderOrganisationId, m.UserId });

        entity.Property(m => m.Role).IsRequired();

        entity.HasOne(m => m.LenderOrganisation)
            .WithMany(o => o.Members)
            .HasForeignKey(m => m.LenderOrganisationId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasIndex(m => m.UserId);
    }
}
