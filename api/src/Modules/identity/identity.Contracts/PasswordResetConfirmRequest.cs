namespace identity.Contracts;

public sealed record PasswordResetConfirmRequest(string Token, string Password);
