using lender.Core.Entities;
using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace lender.Core.Persistence;

internal sealed class LenderAccessRequestEntityConfiguration : IEntityTypeConfiguration<LenderAccessRequest>
{
    public void Configure(EntityTypeBuilder<LenderAccessRequest> entity)
    {
        entity.ToTable("LenderAccessRequests");
        entity.HasKey(r => r.Id);

        entity.Property(r => r.FirstName)
            .HasConversion(new EncryptedStringConverter(LenderEncryptionPurposes.FirstName))
            .HasMaxLength(1024)
            .IsRequired();

        entity.Property(r => r.LastName)
            .HasConversion(new EncryptedStringConverter(LenderEncryptionPurposes.LastName))
            .HasMaxLength(1024)
            .IsRequired();

        entity.Property(r => r.WorkEmail)
            .HasConversion(new EncryptedStringConverter(LenderEncryptionPurposes.WorkEmail))
            .HasMaxLength(1024)
            .IsRequired();

        entity.Property(r => r.WorkEmailLookupHash)
            .HasMaxLength(64)
            .IsRequired();

        entity.Property(r => r.Organisation)
            .HasConversion(new EncryptedStringConverter(LenderEncryptionPurposes.Organisation))
            .HasMaxLength(1024)
            .IsRequired();

        entity.Property(r => r.Website)
            .HasConversion(new EncryptedNullableStringConverter(LenderEncryptionPurposes.Website))
            .HasMaxLength(1024);

        entity.Property(r => r.JobTitle)
            .HasConversion(new EncryptedNullableStringConverter(LenderEncryptionPurposes.JobTitle))
            .HasMaxLength(1024);

        entity.Property(r => r.Message)
            .HasConversion(new EncryptedNullableStringConverter(LenderEncryptionPurposes.Message))
            .HasMaxLength(4096);

        entity.Property(r => r.RejectionReason)
            .HasConversion(new EncryptedNullableStringConverter(LenderEncryptionPurposes.RejectionReason))
            .HasMaxLength(2048);

        entity.Property(r => r.Status).IsRequired();

        entity.HasIndex(r => r.WorkEmailLookupHash);
        entity.HasIndex(r => r.Status);

        entity.HasOne(r => r.LenderOrganisation)
            .WithMany()
            .HasForeignKey(r => r.LenderOrganisationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
