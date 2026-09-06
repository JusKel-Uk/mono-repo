namespace identity.Core.Features.ListSessions;

internal sealed record ListSessionsQuery(Guid UserId, string? CurrentJti);
