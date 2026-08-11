namespace identity.Core.Features.VerifyEmail;

public sealed record VerifyEmailCommand(string Email, string OtpCode);