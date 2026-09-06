namespace identity.Core.Entities;

internal sealed class AuthSession
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Jti { get; set; } = string.Empty;

    public string DeviceLabel { get; set; } = string.Empty;

    public string? UserAgent { get; set; }

    public string? IpAddress { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime? RevokedAt { get; set; }
}
