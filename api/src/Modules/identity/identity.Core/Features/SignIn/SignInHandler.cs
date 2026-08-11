using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using identity.Core.Services;

namespace identity.Core.Features.SignIn;

internal sealed class SignInHandler
{
    private readonly IdentityDbContext _db;
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly IJwtTokenService _jwtTokenService;

    public SignInHandler(IdentityDbContext db, IJwtTokenService jwtTokenService)
    {
        _db = db;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<SignInResponse> HandleAsync(
        SignInCommand command,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Email))
            throw new ArgumentException("Email is required.", nameof(command.Email));

        if (string.IsNullOrWhiteSpace(command.Password))
            throw new ArgumentException("Password is required.", nameof(command.Password));

        var email = command.Email.Trim().ToLowerInvariant();

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null, ct);

        if (user is null)
            throw new ArgumentException("Invalid email or password.");

        var result = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            command.Password);

        if (result == PasswordVerificationResult.Failed)
            throw new ArgumentException("Invalid email or password.");

        if (!user.EmailVerified)
            throw new EmailNotVerifiedException(user.Email);

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        var accessToken = _jwtTokenService.GenerateAccessToken(user.Id, user.Email);

        
        return new SignInResponse(
            UserId: user.Id,
            AccessToken: accessToken);
    }
}