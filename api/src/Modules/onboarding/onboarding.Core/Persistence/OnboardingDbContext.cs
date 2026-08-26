using Microsoft.EntityFrameworkCore;
using onboarding.Core.Entities;

namespace onboarding.Core.Persistence;

internal sealed class OnboardingDbContext : DbContext
{
    public OnboardingDbContext(DbContextOptions<OnboardingDbContext> options)
        : base(options)
    {
    }

    public DbSet<Application> Applications => Set<Application>();

    public DbSet<StepProgress> StepProgress => Set<StepProgress>();

    public DbSet<CompanySetup> CompanySetups => Set<CompanySetup>();

    public DbSet<BusinessProfile> BusinessProfiles => Set<BusinessProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("onboarding");
        modelBuilder.ApplyConfiguration(new ApplicationEntityConfiguration());
        modelBuilder.ApplyConfiguration(new StepProgressEntityConfiguration());
        modelBuilder.ApplyConfiguration(new CompanySetupEntityConfiguration());
        modelBuilder.ApplyConfiguration(new BusinessProfileEntityConfiguration());
    }
}