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
        var configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("Funding")
            ?? "Server=(localdb)\\mssqllocaldb;Database=juskel;Trusted_Connection=True;TrustServerCertificate=True";

        var optionsBuilder = new DbContextOptionsBuilder<FundingDbContext>();
        optionsBuilder.UseSqlServer(connectionString, sql =>
            sql.MigrationsHistoryTable("__EFMigrationsHistory", "funding"));

        return new FundingDbContext(optionsBuilder.Options);
    }
}
