using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using scoring.Core.Persistence;

namespace scoring.Core.Persistence;

internal sealed class DesignTimeScoringDbContextFactory : IDesignTimeDbContextFactory<ScoringDbContext>
{
    public ScoringDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("Scoring")
            ?? "Server=(localdb)\\mssqllocaldb;Database=juskel;Trusted_Connection=True;TrustServerCertificate=True";

        var optionsBuilder = new DbContextOptionsBuilder<ScoringDbContext>();
        optionsBuilder.UseSqlServer(connectionString, sql =>
            sql.MigrationsHistoryTable("__EFMigrationsHistory", "scoring"));

        return new ScoringDbContext(optionsBuilder.Options);
    }
}
