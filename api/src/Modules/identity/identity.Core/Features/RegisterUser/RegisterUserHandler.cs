using identity.Contracts;
using identity.Core.Entities;
using identity.Core.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using identity.Core.Validation;

namespace identity.Core.Features.RegisterUser;

internal sealed class RegisterUserHandler
{
    private readonly IdentityDbContext _db;
    private readonly PasswordHasher<User> _passwordHasher = new();

    public RegisterUserHandler(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<RegisterUserResponse> HandleAsync(
        RegisterUserCommand command,
        CancellationToken ct = default)
    {
        if (!BusinessEmailValidator.IsBusinessEmail(command.Email))
        {
            Console.WriteLine(command);
            Console.WriteLine(nameof(command.Email));
            throw new ArgumentException("A business email address is required. Personal email providers (e.g. Gmail, Yahoo) are not allowed.");
        }

        if (string.IsNullOrWhiteSpace(command.FirstName))
            throw new ArgumentException("First name is required.");

        if (string.IsNullOrWhiteSpace(command.LastName))
            throw new ArgumentException("Last name is required.");

        if (string.IsNullOrWhiteSpace(command.Email))
            throw new ArgumentException("Email is required.");

        if (string.IsNullOrWhiteSpace(command.Password))
            throw new ArgumentException("Password is required.");

        var email = command.Email.Trim().ToLowerInvariant();

        var emailExists = await _db.Users
            .AnyAsync(u => u.Email == email && u.DeletedAt == null, ct);

        if (emailExists)
            throw new ArgumentException("Email is already registered.");

        var now = DateTime.UtcNow;

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = command.FirstName.Trim(),
            LastName = command.LastName.Trim(),
            Email = email,
            CreatedAt = now,
            UpdatedAt = now,
            LastPasswordChangeAt = now
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, command.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return new RegisterUserResponse(user.Id, user.Email);
    }
}