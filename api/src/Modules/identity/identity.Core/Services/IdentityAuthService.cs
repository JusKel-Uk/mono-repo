using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using identity.Core.Validation;
using juskel.Shared.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Services;

internal sealed class IdentityAuthService : IIdentityAuthService
{
    private readonly IdentityDbContext _db;
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IEmailLookupHasher _emailLookupHasher;

    public IdentityAuthService(
        IdentityDbContext db,
        IJwtTokenService jwtTokenService,
        IEmailLookupHasher emailLookupHasher)
    {
        _db = db;
        _jwtTokenService = jwtTokenService;
        _emailLookupHasher = emailLookupHasher;
    }

    public async Task<CredentialValidationResult?> ValidateCredentialsAsync(
        string email,
        string password,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return null;

        var emailLookupHash = _emailLookupHasher.ComputeHash(email);
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.EmailLookupHash == emailLookupHash && u.DeletedAt == null,
                ct);

        if (user is null)
            return null;

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (result == PasswordVerificationResult.Failed)
            return null;

        return new CredentialValidationResult(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.EmailVerified);
    }

    public async Task<Guid?> GetUserIdByEmailAsync(string email, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        var emailLookupHash = _emailLookupHasher.ComputeHash(email);
        var userId = await _db.Users
            .AsNoTracking()
            .Where(u => u.EmailLookupHash == emailLookupHash && u.DeletedAt == null)
            .Select(u => u.Id)
            .FirstOrDefaultAsync(ct);

        return userId == Guid.Empty ? null : userId;
    }

    public async Task<CreateVerifiedUserResult> CreateVerifiedUserAsync(
        CreateVerifiedUserCommand command,
        CancellationToken ct = default)
    {
        if (!BusinessEmailValidator.IsBusinessEmail(command.Email))
        {
            throw new ArgumentException(
                "A business email address is required. Personal email providers are not allowed.");
        }

        if (string.IsNullOrWhiteSpace(command.FirstName))
            throw new ArgumentException("First name is required.");

        if (string.IsNullOrWhiteSpace(command.LastName))
            throw new ArgumentException("Last name is required.");

        if (string.IsNullOrWhiteSpace(command.Password))
            throw new ArgumentException("Password is required.");

        var email = _emailLookupHasher.NormalizeEmail(command.Email);
        var emailLookupHash = _emailLookupHasher.ComputeHash(email);

        var emailExists = await _db.Users
            .AnyAsync(u => u.EmailLookupHash == emailLookupHash && u.DeletedAt == null, ct);

        if (emailExists)
            throw new ArgumentException("Email is already registered.");

        var now = DateTime.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = command.FirstName.Trim(),
            LastName = command.LastName.Trim(),
            Email = email,
            EmailLookupHash = emailLookupHash,
            EmailVerified = true,
            EmailVerifiedAt = now,
            CreatedAt = now,
            UpdatedAt = now,
            LastPasswordChangeAt = now,
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, command.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return new CreateVerifiedUserResult(user.Id, user.Email);
    }

    public async Task<CreateSessionResult> CreateSessionAsync(
        CreateSessionCommand command,
        CancellationToken ct = default)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == command.UserId && u.DeletedAt == null, ct)
            ?? throw new ArgumentException("User not found.");

        var now = DateTime.UtcNow;
        user.LastLoginAt = now;

        var token = _jwtTokenService.GenerateAccessToken(
            user.Id,
            command.Email,
            command.Portal);

        _db.AuthSessions.Add(new AuthSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Jti = token.Jti,
            DeviceLabel = DeviceLabelFormatter.FromUserAgent(command.UserAgent),
            UserAgent = Truncate(command.UserAgent, 512),
            IpAddress = Truncate(command.IpAddress, 64),
            CreatedAt = now,
            ExpiresAt = token.ExpiresAtUtc,
        });

        await _db.SaveChangesAsync(ct);

        return new CreateSessionResult(
            user.Id,
            token.AccessToken,
            user.FirstName,
            user.LastName);
    }

    private static string? Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }
}
