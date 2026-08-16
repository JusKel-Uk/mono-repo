using juskel.Shared.Security;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.DependencyInjection;

namespace identity.Core.Persistence;

internal sealed class DesignTimeIdentityDbContextFactory
    : IDesignTimeDbContextFactory<IdentityDbContext>
{
    public IdentityDbContext CreateDbContext(string[] args)
    {
        var dataProtectionKeysPath = Path.GetFullPath(
            Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", ".data-protection-keys"));

        Directory.CreateDirectory(dataProtectionKeysPath);

        var services = new ServiceCollection();
        services.AddDataProtection()
            .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath))
            .SetApplicationName("juskel");

        var provider = services.BuildServiceProvider().GetRequiredService<IDataProtectionProvider>();
        EncryptedStringConverter.Initialize(new DataProtectionFieldEncryptor(provider));

        var options = new DbContextOptionsBuilder<IdentityDbContext>()
            .UseSqlServer(
                "Server=localhost,1433;Database=juskel;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True",
                sql => sql.MigrationsHistoryTable("__EFMigrationsHistory", "identity"))
            .Options;

        return new IdentityDbContext(options);
    }
}
