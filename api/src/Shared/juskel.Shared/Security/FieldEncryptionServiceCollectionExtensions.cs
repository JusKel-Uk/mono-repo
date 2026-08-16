using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace juskel.Shared.Security;

public static class FieldEncryptionServiceCollectionExtensions
{
    public static IServiceCollection AddFieldEncryption(
        this IServiceCollection services,
        IConfiguration configuration,
        string? dataProtectionKeysPath = null)
    {
        services.Configure<EncryptionOptions>(configuration.GetSection(EncryptionOptions.SectionName));

        var dataProtection = services.AddDataProtection()
            .SetApplicationName("juskel");

        if (!string.IsNullOrWhiteSpace(dataProtectionKeysPath))
        {
            Directory.CreateDirectory(dataProtectionKeysPath);
            dataProtection.PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath));
        }

        services.AddSingleton<IFieldEncryptor, DataProtectionFieldEncryptor>();
        services.AddSingleton<IEmailLookupHasher, EmailLookupHasher>();

        return services;
    }
}
