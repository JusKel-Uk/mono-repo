namespace identity.Contracts;

public sealed record CredentialValidationResult(
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    bool EmailVerified);

public sealed record CreateVerifiedUserCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password);

public sealed record CreateVerifiedUserResult(Guid UserId, string Email);

public sealed record CreateSessionCommand(
    Guid UserId,
    string Email,
    string Portal,
    string? UserAgent,
    string? IpAddress);

public sealed record CreateSessionResult(
    Guid UserId,
    string AccessToken,
    string FirstName,
    string LastName);

public interface IIdentityAuthService
{
    Task<CredentialValidationResult?> ValidateCredentialsAsync(
        string email,
        string password,
        CancellationToken ct = default);

    Task<Guid?> GetUserIdByEmailAsync(string email, CancellationToken ct = default);

    Task<CreateVerifiedUserResult> CreateVerifiedUserAsync(
        CreateVerifiedUserCommand command,
        CancellationToken ct = default);

    Task<CreateSessionResult> CreateSessionAsync(
        CreateSessionCommand command,
        CancellationToken ct = default);
}
