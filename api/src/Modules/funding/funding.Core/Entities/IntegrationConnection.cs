using funding.Contracts;

namespace funding.Core.Entities;

internal sealed class IntegrationConnection
{
    public Guid Id { get; set; }

    public Guid ApplicationId { get; set; }

    public IntegrationProvider Provider { get; set; }

    public string AccessTokenEncrypted { get; set; } = string.Empty;

    public string? RefreshTokenEncrypted { get; set; }

    public DateTime ConnectedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }
}
