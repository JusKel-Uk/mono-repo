namespace identity.Core.Entities;

internal sealed class PasswordResetRequest
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string OtpHash { get; set; } = string.Empty;

    public DateTime OtpExpiresAt { get; set; }

    public int OtpAttempts { get; set; }

    public string? ResetTokenHash { get; set; }

    public DateTime? ResetTokenExpiresAt { get; set; }

    public DateTime? ConsumedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
