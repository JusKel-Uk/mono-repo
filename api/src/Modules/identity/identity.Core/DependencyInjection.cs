using identity.Contracts;
using identity.Core.Features.GetUserById;
using identity.Core.Features.SignIn;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using identity.Core.Features.RegisterUser;

namespace identity.Core;

public static class DependencyInjection
{
    public static IServiceCollection AddIdentityModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Identity")
            ?? throw new InvalidOperationException("Connection string 'Identity' not found.");

        services.AddDbContextPool<IdentityDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
                sql.MigrationsHistoryTable("__EFMigrationsHistory", "identity")));

        services.AddScoped<IIdentityModule, IdentityModule>();
        services.AddScoped<RegisterUserHandler>();
        services.AddScoped<GetUserByIdHandler>();
        services.AddScoped<SignInHandler>();
        return services;
    }
}