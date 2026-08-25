using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace onboarding.Core.Persistence;

internal sealed class DesignTimeOnboardingDbContextFactory
    : IDesignTimeDbContextFactory<OnboardingDbContext>
{
    public OnboardingDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseSqlServer(
                "Server=localhost,1433;Database=juskel;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True",
                sql => sql.MigrationsHistoryTable("__EFMigrationsHistory", "onboarding"))
            .Options;

        return new OnboardingDbContext(options);
    }
}