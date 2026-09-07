using identity.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Persistence;

internal sealed class IdentityDbContext : DbContext
{
    public IdentityDbContext(DbContextOptions<IdentityDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<NotificationPreferences> NotificationPreferences => Set<NotificationPreferences>();

    public DbSet<AuthSession> AuthSessions => Set<AuthSession>();

    public DbSet<PasswordResetRequest> PasswordResetRequests => Set<PasswordResetRequest>();

    public DbSet<Organisation> Organisations => Set<Organisation>();

    public DbSet<OrganisationMember> OrganisationMembers => Set<OrganisationMember>();

    public DbSet<OrganisationInvite> OrganisationInvites => Set<OrganisationInvite>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("identity");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(IdentityDbContext).Assembly);
    }
}
