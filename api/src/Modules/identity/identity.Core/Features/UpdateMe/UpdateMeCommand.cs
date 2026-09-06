namespace identity.Core.Features.UpdateMe;

internal sealed record UpdateMeCommand(
    Guid UserId,
    string FirstName,
    string LastName,
    string? JobTitle,
    string? Phone);
