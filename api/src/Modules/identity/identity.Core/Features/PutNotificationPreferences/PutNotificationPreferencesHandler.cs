using identity.Contracts;

namespace identity.Core.Features.PutNotificationPreferences;

internal sealed class PutNotificationPreferencesHandler
{
    private readonly IIdentityModule _identity;

    public PutNotificationPreferencesHandler(IIdentityModule identity)
    {
        _identity = identity;
    }

    public Task<NotificationPreferencesDto?> HandleAsync(
        PutNotificationPreferencesCommand command,
        CancellationToken ct = default) =>
        _identity.PutNotificationPreferencesAsync(command.UserId, command.Preferences, ct);
}
