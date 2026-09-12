using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using notifications.Core.Entities;

namespace notifications.Core.Persistence;

internal sealed class InboxItemEntityConfiguration : IEntityTypeConfiguration<InboxItem>
{
    public void Configure(EntityTypeBuilder<InboxItem> entity)
    {
        entity.ToTable("InboxItems");
        entity.HasKey(i => i.Id);
        entity.Property(i => i.Title).HasMaxLength(200).IsRequired();
        entity.Property(i => i.Body).HasMaxLength(2000).IsRequired();
        entity.Property(i => i.ActionUrl).HasMaxLength(500);
        entity.Property(i => i.Category).IsRequired();
        entity.Property(i => i.CreatedAt).IsRequired();
        entity.HasIndex(i => new { i.UserId, i.OrganisationId, i.CreatedAt });
        entity.HasIndex(i => new { i.UserId, i.OrganisationId, i.Read });
    }
}
