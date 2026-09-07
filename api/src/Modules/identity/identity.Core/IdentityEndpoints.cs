using identity.Core.Features.ConfirmPasswordReset;
using identity.Core.Features.GetMe;
using identity.Core.Features.GetNotificationPreferences;
using identity.Core.Features.GetUserById;
using identity.Core.Features.ListSessions;
using identity.Core.Features.Organisations;
using identity.Core.Features.PutNotificationPreferences;
using identity.Core.Features.RegisterUser;
using identity.Core.Features.RequestAccountClosure;
using identity.Core.Features.RequestPasswordReset;
using identity.Core.Features.ResendOtp;
using identity.Core.Features.RevokeCurrentSession;
using identity.Core.Features.RevokeSession;
using identity.Core.Features.SignIn;
using identity.Core.Features.UpdateMe;
using identity.Core.Features.VerifyEmail;
using identity.Core.Features.VerifyPasswordReset;
using Microsoft.AspNetCore.Builder;

namespace identity.Core;

public static class IdentityEndpoints
{
    public static WebApplication MapIdentityEndpoints(this WebApplication app)
    {
        app.MapRegisterUserEndpoint();
        app.MapGetUserByIdEndpoint();
        app.MapSignInEndpoint();
        app.MapGetMeEndpoint();
        app.MapUpdateMeEndpoint();
        app.MapGetNotificationPreferencesEndpoint();
        app.MapPutNotificationPreferencesEndpoint();
        app.MapRequestPasswordResetEndpoint();
        app.MapVerifyPasswordResetEndpoint();
        app.MapConfirmPasswordResetEndpoint();
        app.MapListSessionsEndpoint();
        app.MapRevokeCurrentSessionEndpoint();
        app.MapRevokeSessionEndpoint();
        app.MapRequestAccountClosureEndpoint();
        app.MapOrganisationsEndpoints();
        app.MapVerifyEmailEndpoint();
        app.MapResendOtpEndpoint();
        return app;
    }
}
