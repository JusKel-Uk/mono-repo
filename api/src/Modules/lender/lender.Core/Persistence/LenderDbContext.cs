using lender.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace lender.Core.Persistence;

internal sealed class LenderDbContext : DbContext
{
    public LenderDbContext(DbContextOptions<LenderDbContext> options)
        : base(options)
    {
    }

    public DbSet<LenderOrganisation> LenderOrganisations => Set<LenderOrganisation>();

    public DbSet<LenderAccessRequest> LenderAccessRequests => Set<LenderAccessRequest>();

    public DbSet<LenderInvite> LenderInvites => Set<LenderInvite>();

    public DbSet<LenderMember> LenderMembers => Set<LenderMember>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("lender");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(LenderDbContext).Assembly);
    }
}
