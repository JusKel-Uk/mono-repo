using identity.Core.Entities;
using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace identity.Core.Persistence;

internal sealed class UserEntityConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> entity)
    {
        entity.ToTable("Users");
        entity.HasKey(u => u.Id);

        entity.Property(u => u.Email)
            .HasConversion(new EncryptedStringConverter(IdentityEncryptionPurposes.Email))
            .HasMaxLength(1024)
            .IsRequired();

        entity.Property(u => u.EmailLookupHash)
            .HasMaxLength(64)
            .IsRequired();

        entity.Property(u => u.FirstName)
            .HasConversion(new EncryptedStringConverter(IdentityEncryptionPurposes.FirstName))
            .HasMaxLength(1024)
            .IsRequired();

        entity.Property(u => u.LastName)
            .HasConversion(new EncryptedStringConverter(IdentityEncryptionPurposes.LastName))
            .HasMaxLength(1024)
            .IsRequired();

        entity.Property(u => u.PasswordHash)
            .HasMaxLength(512)
            .IsRequired();

        entity.Property(u => u.EmailVerified)
            .HasDefaultValue(false)
            .IsRequired();

        entity.Property(u => u.EmailOtpHash)
            .HasMaxLength(512);

        entity.Property(u => u.EmailOtpAttempts)
            .HasDefaultValue(0)
            .IsRequired();
    }
}
