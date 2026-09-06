using identity.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace identity.Core.Persistence;

internal sealed class AuthSessionEntityConfiguration : IEntityTypeConfiguration<AuthSession>
{
    public void Configure(EntityTypeBuilder<AuthSession> entity)
    {
        entity.ToTable("AuthSessions");
        entity.HasKey(s => s.Id);

        entity.Property(s => s.Jti)
            .HasMaxLength(64)
            .IsRequired();

        entity.Property(s => s.DeviceLabel)
            .HasMaxLength(120)
            .IsRequired();

        entity.Property(s => s.UserAgent).HasMaxLength(512);
        entity.Property(s => s.IpAddress).HasMaxLength(64);

        entity.HasIndex(s => s.Jti).IsUnique();
        entity.HasIndex(s => s.UserId);
    }
}
