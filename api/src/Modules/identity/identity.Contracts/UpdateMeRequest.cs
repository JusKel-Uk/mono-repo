namespace identity.Contracts;

public sealed record UpdateMeRequest(
    string FirstName,
    string LastName,
    string? JobTitle,
    string? Phone);
