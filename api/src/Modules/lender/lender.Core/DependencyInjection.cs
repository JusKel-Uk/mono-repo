using identity.Contracts;
using lender.Contracts;
using lender.Core.Authorization;
using lender.Core.Features.Admin;
using lender.Core.Features.CreateAccount;
using lender.Core.Features.GetMe;
using lender.Core.Features.PreviewInvite;
using lender.Core.Features.RequestAccess;
using lender.Core.Features.SignIn;
using lender.Core.Options;
using lender.Core.Persistence;
using lender.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace lender.Core;

public static class DependencyInjection
{
    public static IServiceCollection AddLenderModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Lender")
            ?? throw new InvalidOperationException("Connection string 'Lender' not found.");

        services.Configure<LenderAdminOptions>(configuration.GetSection(LenderAdminOptions.SectionName));

        services.AddDbContextPool<LenderDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
                sql.MigrationsHistoryTable("__EFMigrationsHistory", "lender")));

        services.AddSingleton<ILenderInviteTokenService, LenderInviteTokenService>();
        services.AddScoped<ILenderAccessRequestNotifier, LenderAccessRequestNotifier>();
        services.AddScoped<LenderModule>();
        services.AddScoped<ILenderModule>(sp => sp.GetRequiredService<LenderModule>());
        services.AddScoped<IPortalMembershipChecker>(sp => sp.GetRequiredService<LenderModule>());

        services.AddScoped<RequestAccessHandler>();
        services.AddScoped<ListAccessRequestsHandler>();
        services.AddScoped<GetAccessRequestHandler>();
        services.AddScoped<ApproveAccessRequestHandler>();
        services.AddScoped<RejectAccessRequestHandler>();
        services.AddScoped<PreviewInviteHandler>();
        services.AddScoped<CreateAccountHandler>();
        services.AddScoped<LenderSignInHandler>();
        services.AddScoped<GetMeHandler>();

        services.AddSingleton<IAuthorizationHandler, LenderAdminAuthorizationHandler>();
        services.AddAuthorizationBuilder()
            .AddPolicy(LenderEndpoints.LenderAdminPolicy, policy =>
                policy.Requirements.Add(new LenderAdminRequirement()));

        return services;
    }
}
