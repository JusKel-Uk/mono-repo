namespace identity.Contracts;

public sealed record UserSummaryDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName);