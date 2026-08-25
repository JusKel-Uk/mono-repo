using funding.Contracts;
using funding.Core.Persistence;
using funding.Core.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace funding.Core;

public static class DependencyInjection
{
    public static IServiceCollection AddFundingModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Funding")
            ?? throw new InvalidOperationException("Connection string 'Funding' not found.");

        services.AddDbContextPool<FundingDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
                sql.MigrationsHistoryTable("__EFMigrationsHistory", "funding")));

        services.AddScoped<IFundingModule, FundingModule>();
        services.AddScoped<FinancialProfileService>();
        services.AddScoped<FundingProfileService>();
        services.AddScoped<IntegrationService>();
        services.AddScoped<EvidenceService>();
        return services;
    }
}
