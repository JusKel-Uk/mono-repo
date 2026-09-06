namespace identity.Contracts;

public sealed record SessionDto(
    Guid Id,
    string DeviceLabel,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    bool IsCurrent);
