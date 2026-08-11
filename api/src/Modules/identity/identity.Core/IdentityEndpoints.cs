using identity.Core.Features.GetUserById;
using Microsoft.AspNetCore.Builder;
using identity.Core.Features.SignIn;
using identity.Core.Features.RegisterUser;
using identity.Core.Features.GetMe;
using identity.Core.Features.VerifyEmail;
using identity.Core.Features.ResendOtp;

namespace identity.Core;

public static class IdentityEndpoints
{
    public static WebApplication MapIdentityEndpoints(this WebApplication app)
    {
        app.MapRegisterUserEndpoint();
        app.MapGetUserByIdEndpoint();
        app.MapSignInEndpoint();
        app.MapGetMeEndpoint();
        app.MapVerifyEmailEndpoint();
        app.MapResendOtpEndpoint();
        return app;
    }
}