using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace identity.Core.Persistence;

internal sealed class DesignTimeIdentityDbContextFactory
    : IDesignTimeDbContextFactory<IdentityDbContext>
{
    public IdentityDbContext CreateDbContext(string[] args)
    {
        var configuration = LoadHostConfiguration();

        var fieldKey = configuration["Encryption:FieldKey"]
            ?? Environment.GetEnvironmentVariable("Encryption__FieldKey")
            ?? "local-dev-field-key-min-32-characters!!";

        var emailLookupKey = configuration["Encryption:EmailLookupKey"]
            ?? Environment.GetEnvironmentVariable("Encryption__EmailLookupKey")
            ?? "local-dev-email-lookup-key-32-chars!!";

        var services = new ServiceCollection();
        services.AddSingleton(Options.Create(new EncryptionOptions
        {
            FieldKey = fieldKey,
            EmailLookupKey = emailLookupKey,
        }));
        services.AddSingleton<IFieldEncryptor, AesFieldEncryptor>();

        EncryptedStringConverter.Initialize(
            services.BuildServiceProvider().GetRequiredService<IFieldEncryptor>());

        var connectionString = configuration.GetConnectionString("Identity")
            ?? throw new InvalidOperationException("ConnectionStrings:Identity is not configured.");

        var options = new DbContextOptionsBuilder<IdentityDbContext>()
            .UseSqlServer(
                connectionString,
                sql => sql.MigrationsHistoryTable("__EFMigrationsHistory", "identity"))
            .Options;

        return new IdentityDbContext(options);
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
