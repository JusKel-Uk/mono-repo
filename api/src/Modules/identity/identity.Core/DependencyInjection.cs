using identity.Contracts;
using identity.Core.Features.GetUserById;
using identity.Core.Features.SignIn;
using identity.Core.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using identity.Core.Features.RegisterUser;
using identity.Core.Features.VerifyEmail;
using identity.Core.Features.ResendOtp;
using identity.Core.Services;

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
        services.AddScoped<VerifyEmailHandler>();
        services.AddSingleton<IEmailOtpService, EmailOtpService>();
        services.AddScoped<IEmailVerificationNotifier, EmailVerificationNotifier>();
        services.AddScoped<RegisterUserHandler>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<GetUserByIdHandler>();
        services.AddScoped<SignInHandler>();
        services.AddScoped<ResendOtpHandler>();
        return services;
    }
}