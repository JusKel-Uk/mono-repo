using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace lender.Core.Persistence;

internal sealed class DesignTimeLenderDbContextFactory : IDesignTimeDbContextFactory<LenderDbContext>
{
    public LenderDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<LenderDbContext>();
        optionsBuilder.UseSqlServer(
            "Server=localhost;Database=juskel;Trusted_Connection=True;TrustServerCertificate=True",
            sql => sql.MigrationsHistoryTable("__EFMigrationsHistory", "lender"));

        return new LenderDbContext(optionsBuilder.Options);
    }
}
