namespace identity.Contracts;

public sealed record VerifyEmailResponse(Guid UserId, string Email, bool EmailVerified);