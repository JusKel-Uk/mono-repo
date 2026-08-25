using juskel.Integrations.BlobStorage;
using juskel.Integrations.CompaniesHouse;
using juskel.Integrations.OpenBanking;
using juskel.Integrations.QuickBooks;
using juskel.Integrations.Xero;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace juskel.Integrations;

public static class DependencyInjection
{
    public static IServiceCollection AddIntegrations(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<CompaniesHouseOptions>(configuration.GetSection(CompaniesHouseOptions.SectionName));
        services.Configure<BlobStorageOptions>(configuration.GetSection(BlobStorageOptions.SectionName));
        services.Configure<OpenBankingOptions>(configuration.GetSection(OpenBankingOptions.SectionName));
        services.Configure<XeroOptions>(configuration.GetSection(XeroOptions.SectionName));
        services.Configure<QuickBooksOptions>(configuration.GetSection(QuickBooksOptions.SectionName));

        services.AddHttpClient<ICompaniesHouseClient, CompaniesHouseClient>();
        services.AddHttpClient<IOpenBankingProvider, TrueLayerOpenBankingProvider>();
        services.AddHttpClient<IXeroClient, XeroClient>();
        services.AddHttpClient<IQuickBooksClient, QuickBooksClient>();

        var blobProvider = configuration
            .GetSection(BlobStorageOptions.SectionName)
            .GetValue<string>("Provider") ?? "Local";

        if (string.Equals(blobProvider, "Azure", StringComparison.OrdinalIgnoreCase))
            services.AddSingleton<IBlobStorage, AzureBlobStorage>();
        else
            services.AddSingleton<IBlobStorage, LocalBlobStorage>();

        return services;
    }
}
