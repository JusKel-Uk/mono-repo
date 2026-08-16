using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace juskel.Shared.Security;

public static class FieldEncryptionServiceCollectionExtensions
{
    public static IServiceCollection AddFieldEncryption(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<EncryptionOptions>(configuration.GetSection(EncryptionOptions.SectionName));
        services.AddSingleton<IFieldEncryptor, AesFieldEncryptor>();
        services.AddSingleton<IEmailLookupHasher, EmailLookupHasher>();

        return services;
    }
}
