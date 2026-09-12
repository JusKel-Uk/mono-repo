using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Features.Organisations;
using identity.Core.Persistence;
using identity.Core.Services;
using identity.Core.Validation;
using juskel.Shared.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace identity.Core.Features.RegisterUser;

internal sealed class RegisterUserHandler
{
    private readonly IdentityDbContext _db;
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly IEmailOtpService _emailOtpService;
    private readonly IEmailVerificationNotifier _emailVerificationNotifier;
    private readonly IEmailLookupHasher _emailLookupHasher;
    private readonly IOrganisationInviteTokenService _inviteTokens;

    public RegisterUserHandler(
        IdentityDbContext db,
        IEmailOtpService emailOtpService,
        IEmailVerificationNotifier emailVerificationNotifier,
        IEmailLookupHasher emailLookupHasher,
        IOrganisationInviteTokenService inviteTokens)
    {
        _db = db;
        _emailOtpService = emailOtpService;
        _emailVerificationNotifier = emailVerificationNotifier;
        _emailLookupHasher = emailLookupHasher;
        _inviteTokens = inviteTokens;
    }

    public async Task<RegisterUserResponse> HandleAsync(
        RegisterUserCommand command,
        CancellationToken ct = default)
    {
        if (!BusinessEmailValidator.IsBusinessEmail(command.Email))
        {
            throw new ArgumentException(
                "A business email address is required. Personal email providers (e.g. Gmail, Yahoo) are not allowed.");
        }

        if (string.IsNullOrWhiteSpace(command.FirstName))
            throw new ArgumentException("First name is required.");

        if (string.IsNullOrWhiteSpace(command.LastName))
            throw new ArgumentException("Last name is required.");

        if (string.IsNullOrWhiteSpace(command.Email))
            throw new ArgumentException("Email is required.");

        if (string.IsNullOrWhiteSpace(command.Password))
            throw new ArgumentException("Password is required.");

        var email = _emailLookupHasher.NormalizeEmail(command.Email);
        var emailLookupHash = _emailLookupHasher.ComputeHash(email);

        var emailExists = await _db.Users
            .AnyAsync(u => u.EmailLookupHash == emailLookupHash && u.DeletedAt == null, ct);

        if (emailExists)
            throw new ArgumentException("Email is already registered.");

        var invite = await ResolveInviteAsync(command.InviteCode, emailLookupHash, ct);

        var now = DateTime.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = command.FirstName.Trim(),
            LastName = command.LastName.Trim(),
            Email = email,
            EmailLookupHash = emailLookupHash,
            CreatedAt = now,
            UpdatedAt = now,
            LastPasswordChangeAt = now,
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, command.Password);

        if (invite is not null)
            return await RegisterInvitedUserAsync(user, ct);

        return await RegisterFounderAsync(user, email, now, ct);
    }

    private async Task<OrganisationInvite?> ResolveInviteAsync(
        string? inviteCode,
        string emailLookupHash,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(inviteCode))
            return null;

        var invite = await OrganisationInviteQueries.FindPendingByCodeAsync(
            _db,
            _inviteTokens,
            inviteCode,
            ct);

        if (invite is null)
            throw new ArgumentException("This invite is invalid, expired, or already used.");

        if (!string.Equals(emailLookupHash, invite.EmailLookupHash, StringComparison.Ordinal))
            throw new ArgumentException("Email must match the invitation.");

        return invite;
    }

    private async Task<RegisterUserResponse> RegisterInvitedUserAsync(
        User user,
        CancellationToken ct)
    {
        user.EmailVerified = true;
        user.LastOrganisationId = null;
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return new RegisterUserResponse(user.Id, user.Email, user.EmailVerified, null);
    }

    private async Task<RegisterUserResponse> RegisterFounderAsync(
        User user,
        string email,
        DateTime now,
        CancellationToken ct)
    {
        if (!BusinessEmailValidator.TryGetDomain(email, out var emailDomain))
            throw new ArgumentException("A valid business email address is required.");

        var organisationId = Guid.NewGuid();
        user.EmailVerified = false;
        user.LastOrganisationId = organisationId;

        var organisation = new Organisation
        {
            Id = organisationId,
            Name = DeriveOrganisationName(email),
            EmailDomain = emailDomain,
            CreatedAt = now,
            UpdatedAt = now,
        };

        var membership = new OrganisationMember
        {
            OrganisationId = organisationId,
            UserId = user.Id,
            Role = OrganisationRole.Owner,
            JoinedAt = now,
        };

        var otp = _emailOtpService.IssueOtp(user);
        _db.Users.Add(user);
        _db.Organisations.Add(organisation);
        _db.OrganisationMembers.Add(membership);
        await _db.SaveChangesAsync(ct);

        E2eOtpBridge.LogOtpIfDevelopment(user.Email, otp.PlainCode);
        await _emailVerificationNotifier.SendVerificationOtpAsync(user, otp.DisplayCode, ct);

        return new RegisterUserResponse(user.Id, user.Email, user.EmailVerified, organisationId);
    }

    private static string DeriveOrganisationName(string email)
    {
        var atIndex = email.IndexOf('@');
        if (atIndex <= 0 || atIndex >= email.Length - 1)
            return "My company";

        var domain = email[(atIndex + 1)..];
        var companyPart = domain.Split('.')[0];
        return string.IsNullOrWhiteSpace(companyPart)
            ? "My company"
            : char.ToUpperInvariant(companyPart[0]) + companyPart[1..];
    }
}
