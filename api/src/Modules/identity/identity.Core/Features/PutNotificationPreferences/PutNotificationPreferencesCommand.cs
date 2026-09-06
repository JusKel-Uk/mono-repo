using identity.Contracts;

namespace identity.Core.Features.PutNotificationPreferences;

internal sealed record PutNotificationPreferencesCommand(
    Guid UserId,
    NotificationPreferencesDto Preferences);
