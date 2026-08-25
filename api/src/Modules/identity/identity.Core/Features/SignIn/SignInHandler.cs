using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using juskel.Shared.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using identity.Core.Services;

namespace identity.Core.Features.SignIn;

internal sealed class SignInHandler
{
    private readonly IdentityDbContext _db;
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IEmailLookupHasher _emailLookupHasher;

    public SignInHandler(
        IdentityDbContext db,
        IJwtTokenService jwtTokenService,
        IEmailLookupHasher emailLookupHasher)
    {
        _db = db;
        _jwtTokenService = jwtTokenService;
        _emailLookupHasher = emailLookupHasher;
    }

    public async Task<SignInResponse> HandleAsync(
        SignInCommand command,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Email))
            throw new ArgumentException("Email is required.", nameof(command.Email));

        if (string.IsNullOrWhiteSpace(command.Password))
            throw new ArgumentException("Password is required.", nameof(command.Password));

        var emailLookupHash = _emailLookupHasher.ComputeHash(command.Email);

        var user = await _db.Users
            .FirstOrDefaultAsync(
                u => u.EmailLookupHash == emailLookupHash && u.DeletedAt == null,
                ct);

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
            AccessToken: accessToken,
            FirstName: user.FirstName,
            LastName: user.LastName);
    }
}