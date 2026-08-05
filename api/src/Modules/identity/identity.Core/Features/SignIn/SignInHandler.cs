using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.SignIn;

internal sealed class SignInHandler
{
    private readonly IdentityDbContext _db;
    private readonly PasswordHasher<User> _passwordHasher = new();

    public SignInHandler(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<SignInResponse> HandleAsync(
        SignInCommand command,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Email))
            throw new ArgumentException("Email is required.", nameof(command.Email));

        if (string.IsNullOrWhiteSpace(command.Password))
            throw new ArgumentException("Password is required.", nameof(command.Password));

        var email = command.Email.Trim();

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

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        // JWT comes in a later session — stub token for now
        return new SignInResponse(
            UserId: user.Id,
            AccessToken: "stub-access-token");
    }
}