namespace identity.Contracts;

public sealed record RegisterUserRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password);