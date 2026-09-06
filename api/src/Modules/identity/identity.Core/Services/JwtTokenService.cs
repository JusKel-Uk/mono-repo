using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using juskel.Shared;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace identity.Core.Services;

internal sealed record AccessTokenResult(string AccessToken, string Jti, DateTime ExpiresAtUtc);

internal interface IJwtTokenService
{
    AccessTokenResult GenerateAccessToken(Guid userId, string email);
}

internal sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public AccessTokenResult GenerateAccessToken(Guid userId, string email)
    {
        if (string.IsNullOrWhiteSpace(_options.Secret))
            throw new InvalidOperationException("JWT secret is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var jti = Guid.NewGuid().ToString("N");
        var expiresAt = DateTime.UtcNow.AddMinutes(_options.ExpiresInMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, jti)
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return new AccessTokenResult(
            new JwtSecurityTokenHandler().WriteToken(token),
            jti,
            expiresAt);
    }
}
