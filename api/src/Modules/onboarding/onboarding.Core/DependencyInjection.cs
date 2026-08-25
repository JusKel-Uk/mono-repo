using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using onboarding.Contracts;
using onboarding.Core.Persistence;
using onboarding.Core.Services;

namespace onboarding.Core;

public static class DependencyInjection
{
    public static IServiceCollection AddOnboardingModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Onboarding")
            ?? throw new InvalidOperationException("Connection string 'Onboarding' not found.");

        services.AddDbContextPool<OnboardingDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
                sql.MigrationsHistoryTable("__EFMigrationsHistory", "onboarding")));

        services.AddScoped<IOnboardingModule, OnboardingModule>();
        services.AddScoped<OnboardingApplicationService>();
        services.AddScoped<CompanySetupService>();
        services.AddScoped<BusinessProfileService>();
        return services;
    }
}
