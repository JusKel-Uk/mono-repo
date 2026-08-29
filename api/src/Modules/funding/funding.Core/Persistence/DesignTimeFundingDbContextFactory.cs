using funding.Contracts;
using funding.Core.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace funding.Core.Persistence;

internal sealed class DesignTimeFundingDbContextFactory : IDesignTimeDbContextFactory<FundingDbContext>
{
    public FundingDbContext CreateDbContext(string[] args)
    {
        var connectionString = LoadHostConfiguration().GetConnectionString("Funding")
            ?? throw new InvalidOperationException("ConnectionStrings:Funding is not configured.");

        var optionsBuilder = new DbContextOptionsBuilder<FundingDbContext>();
        optionsBuilder.UseSqlServer(connectionString, sql =>
            sql.MigrationsHistoryTable("__EFMigrationsHistory", "funding"));

        return new FundingDbContext(optionsBuilder.Options);
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
