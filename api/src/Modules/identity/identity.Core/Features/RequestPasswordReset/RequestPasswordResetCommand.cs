namespace identity.Core.Features.RequestPasswordReset;

internal sealed record RequestPasswordResetCommand(string? Email, Guid? UserId, string? Portal = null);
