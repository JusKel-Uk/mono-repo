using identity.Core.Features.GetUserById;
using Microsoft.AspNetCore.Builder;
using identity.Core.Features.SignIn;
using identity.Core.Features.RegisterUser;

namespace identity.Core;

public static class IdentityEndpoints
{
    public static WebApplication MapIdentityEndpoints(this WebApplication app)
    {
        app.MapRegisterUserEndpoint();
        app.MapGetUserByIdEndpoint();
        app.MapSignInEndpoint();
        return app;
    }
}