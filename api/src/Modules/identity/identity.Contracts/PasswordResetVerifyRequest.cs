namespace identity.Contracts;

public sealed record PasswordResetVerifyRequest(string Email, string Code);
