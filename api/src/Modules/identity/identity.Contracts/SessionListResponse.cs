namespace identity.Contracts;

public sealed record SessionListResponse(IReadOnlyList<SessionDto> Sessions);
