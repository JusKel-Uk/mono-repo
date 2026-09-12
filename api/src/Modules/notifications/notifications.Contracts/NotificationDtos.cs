namespace notifications.Contracts;

public sealed record NotifyCommand(
    Guid UserId,
    Guid OrganisationId,
    NotificationCategory Category,
    string Title,
    string Body,
    IReadOnlyList<NotificationChannel> RequestedChannels,
    string? ActionUrl = null);

public sealed record ChannelDeliveryResult(bool Success, bool Skipped, string? Error = null);

public sealed record NotifyResult(
    bool Skipped,
    ChannelDeliveryResult? InApp = null,
    ChannelDeliveryResult? Email = null);

public sealed record InboxItemDto(
    Guid Id,
    string Title,
    string Category,
    string Body,
    DateTime CreatedAt,
    bool Read,
    string? ActionUrl);

public sealed record InboxListResponse(IReadOnlyList<InboxItemDto> Items);

public sealed record UnreadCountResponse(int Count);

public static class ProductNotifications
{
    public static readonly IReadOnlyList<NotificationChannel> DefaultChannels =
        [NotificationChannel.InApp, NotificationChannel.Email];

    public static NotifyCommand AssessmentProgress(
        Guid userId,
        Guid organisationId,
        string title,
        string body,
        string? actionUrl = null) =>
        new(userId, organisationId, NotificationCategory.AssessmentProgress, title, body, DefaultChannels, actionUrl);

    public static NotifyCommand Integration(
        Guid userId,
        Guid organisationId,
        string title,
        string body,
        string? actionUrl = null) =>
        new(userId, organisationId, NotificationCategory.IntegrationSyncEvents, title, body, DefaultChannels, actionUrl);
}

public interface INotificationModule
{
    Task<NotifyResult> NotifyAsync(NotifyCommand command, CancellationToken ct = default);
}
