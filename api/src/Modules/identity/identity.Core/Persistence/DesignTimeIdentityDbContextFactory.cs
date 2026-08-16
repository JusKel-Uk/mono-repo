using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace identity.Core.Persistence;

internal sealed class DesignTimeIdentityDbContextFactory
    : IDesignTimeDbContextFactory<IdentityDbContext>
{
    public IdentityDbContext CreateDbContext(string[] args)
    {
        var fieldKey = Environment.GetEnvironmentVariable("Encryption__FieldKey")
            ?? "local-dev-field-key-min-32-characters!!";

        var services = new ServiceCollection();
        services.AddSingleton(Options.Create(new EncryptionOptions
        {
            FieldKey = fieldKey,
            EmailLookupKey = Environment.GetEnvironmentVariable("Encryption__EmailLookupKey")
                ?? "local-dev-email-lookup-key-32-chars!!",
        }));
        services.AddSingleton<IFieldEncryptor, AesFieldEncryptor>();

        EncryptedStringConverter.Initialize(
            services.BuildServiceProvider().GetRequiredService<IFieldEncryptor>());

        var options = new DbContextOptionsBuilder<IdentityDbContext>()
            .UseSqlServer(
                "Server=localhost,1433;Database=juskel;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True",
                sql => sql.MigrationsHistoryTable("__EFMigrationsHistory", "identity"))
            .Options;

        return new IdentityDbContext(options);
    }
}
