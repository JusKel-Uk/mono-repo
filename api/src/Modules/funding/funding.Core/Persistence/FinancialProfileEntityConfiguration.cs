using funding.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace funding.Core.Persistence;

internal sealed class FinancialProfileEntityConfiguration : IEntityTypeConfiguration<FinancialProfile>
{
    public void Configure(EntityTypeBuilder<FinancialProfile> entity)
    {
        entity.ToTable("FinancialProfiles");
        entity.HasKey(f => f.ApplicationId);
        entity.Property(f => f.UpdatedAt).IsRequired();
    }
}

internal sealed class FundingProfileEntityConfiguration : IEntityTypeConfiguration<FundingProfile>
{
    public void Configure(EntityTypeBuilder<FundingProfile> entity)
    {
        entity.ToTable("FundingProfiles");
        entity.HasKey(f => f.ApplicationId);
        entity.Property(f => f.RequestedAmount).HasPrecision(18, 2).IsRequired();
        entity.Property(f => f.TermMonths).IsRequired();
        entity.Property(f => f.UpdatedAt).IsRequired();
    }
}

internal sealed class IntegrationConnectionEntityConfiguration : IEntityTypeConfiguration<IntegrationConnection>
{
    public void Configure(EntityTypeBuilder<IntegrationConnection> entity)
    {
        entity.ToTable("IntegrationConnections");
        entity.HasKey(i => i.Id);
        entity.Property(i => i.AccessTokenEncrypted).HasMaxLength(4000).IsRequired();
        entity.Property(i => i.RefreshTokenEncrypted).HasMaxLength(4000);
        entity.Property(i => i.ExternalRealmId).HasMaxLength(64);
        entity.Property(i => i.ProviderMetadataJson).HasMaxLength(4000);
        entity.HasIndex(i => new { i.ApplicationId, i.Provider }).IsUnique();
    }
}

internal sealed class FinancialEvidenceEntityConfiguration : IEntityTypeConfiguration<FinancialEvidence>
{
    public void Configure(EntityTypeBuilder<FinancialEvidence> entity)
    {
        entity.ToTable("FinancialEvidence");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.FileName).HasMaxLength(255).IsRequired();
        entity.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
        entity.Property(e => e.BlobPath).HasMaxLength(500).IsRequired();
        entity.Property(e => e.UploadedAt).IsRequired();
    }
}

internal sealed class FinancialIntegrationMetricsEntityConfiguration
    : IEntityTypeConfiguration<FinancialIntegrationMetrics>
{
    public void Configure(EntityTypeBuilder<FinancialIntegrationMetrics> entity)
    {
        entity.ToTable("FinancialIntegrationMetrics");
        entity.HasKey(m => m.ApplicationId);
        entity.Property(m => m.Currency).HasMaxLength(3).IsRequired();
        entity.Property(m => m.SyncedAt).IsRequired();

        ConfigureMoney(entity, m => m.AnnualRevenue);
        ConfigureMoney(entity, m => m.PriorAnnualRevenue);
        ConfigureMoney(entity, m => m.GrossProfit);
        ConfigureMoney(entity, m => m.OperatingProfit);
        ConfigureMoney(entity, m => m.NetIncome);
        ConfigureMoney(entity, m => m.PriorNetIncome);
        ConfigureMoney(entity, m => m.Ebitda);
        ConfigureMoney(entity, m => m.CashBalance);
        ConfigureMoney(entity, m => m.AccountsReceivable);
        ConfigureMoney(entity, m => m.AccountsPayable);
        ConfigureMoney(entity, m => m.CurrentAssets);
        ConfigureMoney(entity, m => m.CurrentLiabilities);
        ConfigureMoney(entity, m => m.WorkingCapital);
        ConfigureMoney(entity, m => m.TotalAssets);
        ConfigureMoney(entity, m => m.TotalLiabilities);
        ConfigureMoney(entity, m => m.TotalEquity);
        ConfigureMoney(entity, m => m.OutstandingDebt);
        ConfigureMoney(entity, m => m.OperatingCashFlow);

        ConfigureRatio(entity, m => m.CurrentRatio);
        ConfigureRatio(entity, m => m.DebtToAssets);
        ConfigureRatio(entity, m => m.ProfitMargin);
        ConfigureRatio(entity, m => m.RevenueGrowthYoY);
        ConfigureRatio(entity, m => m.NetIncomeGrowthYoY);
    }

    private static void ConfigureMoney(
        EntityTypeBuilder<FinancialIntegrationMetrics> entity,
        System.Linq.Expressions.Expression<Func<FinancialIntegrationMetrics, decimal?>> property) =>
        entity.Property(property).HasPrecision(18, 2);

    private static void ConfigureRatio(
        EntityTypeBuilder<FinancialIntegrationMetrics> entity,
        System.Linq.Expressions.Expression<Func<FinancialIntegrationMetrics, decimal?>> property) =>
        entity.Property(property).HasPrecision(18, 4);
}
