using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using identity.Core.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.ConfirmPasswordReset;

internal sealed class ConfirmPasswordResetHandler
{
    private const string InvalidTokenMessage = "Invalid or expired reset token.";

    private readonly IdentityDbContext _db;
    private readonly IPasswordResetOtpService _otpService;
    private readonly PasswordHasher<User> _passwordHasher = new();

    public ConfirmPasswordResetHandler(
        IdentityDbContext db,
        IPasswordResetOtpService otpService)
    {
        _db = db;
        _otpService = otpService;
    }

    public async Task HandleAsync(
        PasswordResetConfirmRequest request,
        string? portal,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
            throw new ArgumentException("Reset token is required.");

        ValidatePassword(request.Password, portal);

        if (!PasswordResetTokens.TrySplit(request.Token, out var requestId, out var secret))
            throw new ArgumentException(InvalidTokenMessage);

        var reset = await _db.PasswordResetRequests
            .FirstOrDefaultAsync(r => r.Id == requestId, ct)
            ?? throw new ArgumentException(InvalidTokenMessage);

        if (!_otpService.VerifyResetToken(reset, secret))
            throw new ArgumentException(InvalidTokenMessage);

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == reset.UserId && u.DeletedAt == null, ct)
            ?? throw new ArgumentException(InvalidTokenMessage);

        var now = DateTime.UtcNow;
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        user.LastPasswordChangeAt = now;
        user.UpdatedAt = now;
        reset.ConsumedAt = now;

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        await AuthSessionRevocation.RevokeAllForUserAsync(_db, user.Id, now, ct);
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    private static void ValidatePassword(string password, string? portal)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password is required.");

        if (string.Equals(portal, PortalNames.Lender, StringComparison.OrdinalIgnoreCase))
        {
            if (password.Length < 12)
                throw new ArgumentException("Password must be at least 12 characters.");

            if (!password.Any(char.IsLower))
                throw new ArgumentException("Password must include a lowercase letter.");

            if (!password.Any(char.IsUpper))
                throw new ArgumentException("Password must include an uppercase letter.");

            if (!password.Any(char.IsDigit))
                throw new ArgumentException("Password must include a number.");

            if (!password.Any(ch => !char.IsLetterOrDigit(ch)))
                throw new ArgumentException("Password must include a special symbol.");

            return;
        }

        if (password.Length < 8)
            throw new ArgumentException("Password must be at least 8 characters.");
    }
}
