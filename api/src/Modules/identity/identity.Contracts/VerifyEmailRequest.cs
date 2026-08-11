namespace identity.Contracts;

public sealed record VerifyEmailRequest(string Email, string OtpCode);