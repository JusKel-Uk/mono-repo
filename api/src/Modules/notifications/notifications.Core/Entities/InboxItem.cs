using notifications.Contracts;

namespace notifications.Core.Entities;

internal sealed class InboxItem
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid OrganisationId { get; set; }

    public NotificationCategory Category { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public string? ActionUrl { get; set; }

    public bool Read { get; set; }

    public DateTime? ReadAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public bool InAppDelivered { get; set; }

    public bool EmailDelivered { get; set; }
}
