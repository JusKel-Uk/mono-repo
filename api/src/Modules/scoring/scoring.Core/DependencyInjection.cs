using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using scoring.Contracts;
using scoring.Core.Persistence;
using scoring.Core.Services;

namespace scoring.Core;

public static class DependencyInjection
{
    public static IServiceCollection AddScoringModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Scoring")
            ?? throw new InvalidOperationException("Connection string 'Scoring' not found.");

        services.AddDbContextPool<ScoringDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
                sql.MigrationsHistoryTable("__EFMigrationsHistory", "scoring")));

        services.AddScoped<IScoringModule, ScoringModule>();
        services.AddScoped<SustainabilityProfileService>();
        services.AddScoped<EvidenceService>();
        return services;
    }
}
