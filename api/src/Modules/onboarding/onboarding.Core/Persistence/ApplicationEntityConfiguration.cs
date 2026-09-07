using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using onboarding.Core.Entities;

namespace onboarding.Core.Persistence;

internal sealed class ApplicationEntityConfiguration : IEntityTypeConfiguration<Application>
{
    public void Configure(EntityTypeBuilder<Application> entity)
    {
        entity.ToTable("Applications");
        entity.HasKey(a => a.Id);

        entity.Property(a => a.UserId).IsRequired();
        entity.Property(a => a.OrganisationId).IsRequired();
        entity.Property(a => a.Status).IsRequired();
        entity.Property(a => a.CreatedAt).IsRequired();
        entity.Property(a => a.UpdatedAt).IsRequired();

        entity.HasIndex(a => a.OrganisationId)
            .IsUnique()
            .HasFilter("[Status] = 0");

        entity.HasIndex(a => a.UserId);

        entity.HasMany(a => a.Steps)
            .WithOne(s => s.Application)
            .HasForeignKey(s => s.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
