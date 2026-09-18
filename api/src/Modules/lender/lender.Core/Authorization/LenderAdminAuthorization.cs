using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using lender.Core.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace lender.Core.Authorization;

public sealed class LenderAdminRequirement : IAuthorizationRequirement;

internal sealed class LenderAdminAuthorizationHandler : AuthorizationHandler<LenderAdminRequirement>
{
    private readonly LenderAdminOptions _options;
    private readonly IWebHostEnvironment _environment;

    public LenderAdminAuthorizationHandler(
        IOptions<LenderAdminOptions> options,
        IWebHostEnvironment environment)
    {
        _options = options.Value;
        _environment = environment;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        LenderAdminRequirement requirement)
    {
        var raw = context.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(raw, out var userId))
            return Task.CompletedTask;

        if (_options.AdminUserIds.Contains(userId))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Development convenience: any authenticated user may admin when allowlist is empty.
        if (_environment.IsDevelopment() && _options.AdminUserIds.Count == 0)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
