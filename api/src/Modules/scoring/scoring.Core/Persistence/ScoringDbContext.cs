using Microsoft.EntityFrameworkCore;
using scoring.Core.Entities;

namespace scoring.Core.Persistence;

internal sealed class ScoringDbContext : DbContext
{
    public ScoringDbContext(DbContextOptions<ScoringDbContext> options)
        : base(options)
    {
    }

    public DbSet<SustainabilityProfile> SustainabilityProfiles => Set<SustainabilityProfile>();

    public DbSet<SustainabilityEvidence> SustainabilityEvidence => Set<SustainabilityEvidence>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("scoring");
        modelBuilder.ApplyConfiguration(new SustainabilityProfileEntityConfiguration());
        modelBuilder.ApplyConfiguration(new SustainabilityEvidenceEntityConfiguration());
    }
}
