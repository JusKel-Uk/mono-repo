using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using scoring.Core.Persistence;

namespace scoring.Core.Persistence;

internal sealed class DesignTimeScoringDbContextFactory : IDesignTimeDbContextFactory<ScoringDbContext>
{
    public ScoringDbContext CreateDbContext(string[] args)
    {
        var connectionString = LoadHostConfiguration().GetConnectionString("Scoring")
            ?? throw new InvalidOperationException("ConnectionStrings:Scoring is not configured.");

        var optionsBuilder = new DbContextOptionsBuilder<ScoringDbContext>();
        optionsBuilder.UseSqlServer(connectionString, sql =>
            sql.MigrationsHistoryTable("__EFMigrationsHistory", "scoring"));

        return new ScoringDbContext(optionsBuilder.Options);
    }

    private static IConfiguration LoadHostConfiguration() =>
        new ConfigurationBuilder()
            .SetBasePath(ResolveHostProjectPath())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddUserSecrets("e58049ed-cab6-4f81-b1d4-bc2e2cde0d23")
            .AddEnvironmentVariables()
            .Build();

    private static string ResolveHostProjectPath()
    {
        for (var dir = new DirectoryInfo(Directory.GetCurrentDirectory()); dir is not null; dir = dir.Parent)
        {
            var candidate = Path.Combine(dir.FullName, "src", "Host", "juskel.Api");
            if (Directory.Exists(candidate))
                return candidate;
        }

        throw new InvalidOperationException("Could not locate juskel.Api host project.");
    }
}
