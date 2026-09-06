namespace identity.Contracts;

public sealed record MeProfileDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string? JobTitle,
    string? Phone,
    DateTime? AccountClosureRequestedAt);
