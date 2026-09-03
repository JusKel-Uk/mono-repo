using funding.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace funding.Core.Persistence;

internal sealed class FundingDbContext : DbContext
{
    public FundingDbContext(DbContextOptions<FundingDbContext> options)
        : base(options)
    {
    }

    public DbSet<FinancialProfile> FinancialProfiles => Set<FinancialProfile>();

    public DbSet<FundingProfile> FundingProfiles => Set<FundingProfile>();

    public DbSet<IntegrationConnection> IntegrationConnections => Set<IntegrationConnection>();

    public DbSet<FinancialEvidence> FinancialEvidence => Set<FinancialEvidence>();

    public DbSet<FinancialIntegrationMetrics> FinancialIntegrationMetrics => Set<FinancialIntegrationMetrics>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("funding");
        modelBuilder.ApplyConfiguration(new FinancialProfileEntityConfiguration());
        modelBuilder.ApplyConfiguration(new FundingProfileEntityConfiguration());
        modelBuilder.ApplyConfiguration(new IntegrationConnectionEntityConfiguration());
        modelBuilder.ApplyConfiguration(new FinancialEvidenceEntityConfiguration());
        modelBuilder.ApplyConfiguration(new FinancialIntegrationMetricsEntityConfiguration());
    }
}
