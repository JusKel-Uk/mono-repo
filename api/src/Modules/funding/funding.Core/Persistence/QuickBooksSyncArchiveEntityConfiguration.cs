using funding.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace funding.Core.Persistence;

internal sealed class QuickBooksSyncArchiveEntityConfiguration : IEntityTypeConfiguration<QuickBooksSyncArchive>
{
    public void Configure(EntityTypeBuilder<QuickBooksSyncArchive> entity)
    {
        entity.ToTable("QuickBooksSyncArchive");
        entity.HasKey(a => a.ApplicationId);
        entity.Property(a => a.ExternalRealmId).HasMaxLength(64).IsRequired();
        entity.Property(a => a.SyncedAt).IsRequired();
        entity.Property(a => a.CompanyInfoJson);
        entity.Property(a => a.ProfitAndLossJson);
        entity.Property(a => a.ProfitAndLossPriorJson);
        entity.Property(a => a.BalanceSheetJson);
        entity.Property(a => a.AgedReceivablesJson);
        entity.Property(a => a.AgedPayablesJson);
        entity.Property(a => a.CashFlowJson);
        entity.Property(a => a.AccountsJson);
        entity.Property(a => a.ExtendedSnapshotJson);
    }
}
