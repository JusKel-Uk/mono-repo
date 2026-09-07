using identity.Contracts;
using identity.Core.Features.ConfirmPasswordReset;
using identity.Core.Features.GetMe;
using identity.Core.Features.GetNotificationPreferences;
using identity.Core.Features.GetUserById;
using identity.Core.Features.ListSessions;
using identity.Core.Features.Organisations;
using identity.Core.Features.PutNotificationPreferences;
using identity.Core.Features.RegisterUser;
using identity.Core.Features.RequestPasswordReset;
using identity.Core.Features.ResendOtp;
using identity.Core.Features.RevokeCurrentSession;
using identity.Core.Features.RevokeSession;
using identity.Core.Features.SignIn;
using identity.Core.Features.UpdateMe;
using identity.Core.Features.VerifyEmail;
using identity.Core.Features.VerifyPasswordReset;
using identity.Core.Persistence;
using identity.Core.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

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
        services.AddScoped<IOrganisationContextResolver, OrganisationContextResolver>();
        services.AddScoped<IAuthSessionValidator, AuthSessionValidator>();
        services.AddScoped<VerifyEmailHandler>();
        services.AddSingleton<IEmailOtpService, EmailOtpService>();
        services.AddSingleton<IPasswordResetOtpService, PasswordResetOtpService>();
        services.AddSingleton<IOrganisationInviteTokenService, OrganisationInviteTokenService>();
        services.AddScoped<IEmailVerificationNotifier, EmailVerificationNotifier>();
        services.AddScoped<IOrganisationInviteNotifier, OrganisationInviteNotifier>();
        services.AddScoped<IPasswordResetNotifier, PasswordResetNotifier>();
        services.AddScoped<RegisterUserHandler>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<GetUserByIdHandler>();
        services.AddScoped<GetMeHandler>();
        services.AddScoped<UpdateMeHandler>();
        services.AddScoped<GetNotificationPreferencesHandler>();
        services.AddScoped<PutNotificationPreferencesHandler>();
        services.AddScoped<RequestPasswordResetHandler>();
        services.AddScoped<VerifyPasswordResetHandler>();
        services.AddScoped<ConfirmPasswordResetHandler>();
        services.AddScoped<ListSessionsHandler>();
        services.AddScoped<RevokeSessionHandler>();
        services.AddScoped<RevokeCurrentSessionHandler>();
        services.AddScoped<ListOrganisationsHandler>();
        services.AddScoped<SetCurrentOrganisationHandler>();
        services.AddScoped<ListOrganisationMembersHandler>();
        services.AddScoped<CreateOrganisationInviteHandler>();
        services.AddScoped<ListOrganisationInvitesHandler>();
        services.AddScoped<ResendOrganisationInviteHandler>();
        services.AddScoped<AcceptOrganisationInviteHandler>();
        services.AddScoped<UpdateOrganisationMemberHandler>();
        services.AddScoped<RemoveOrganisationMemberHandler>();
        services.AddScoped<RequestOrganisationClosureHandler>();
        services.AddScoped<SignInHandler>();
        services.AddScoped<ResendOtpHandler>();
        return services;
    }
}
