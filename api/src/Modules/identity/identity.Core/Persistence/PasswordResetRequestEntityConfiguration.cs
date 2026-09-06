using identity.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace identity.Core.Persistence;

internal sealed class PasswordResetRequestEntityConfiguration
    : IEntityTypeConfiguration<PasswordResetRequest>
{
    public void Configure(EntityTypeBuilder<PasswordResetRequest> entity)
    {
        entity.ToTable("PasswordResetRequests");
        entity.HasKey(r => r.Id);

        entity.Property(r => r.OtpHash)
            .HasMaxLength(512)
            .IsRequired();

        entity.Property(r => r.ResetTokenHash).HasMaxLength(512);

        entity.HasIndex(r => r.UserId);
    }
}
