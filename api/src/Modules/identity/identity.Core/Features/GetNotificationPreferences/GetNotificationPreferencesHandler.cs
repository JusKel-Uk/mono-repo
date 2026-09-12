using identity.Contracts;

namespace identity.Core.Features.GetNotificationPreferences;

internal sealed class GetNotificationPreferencesHandler
{
    private readonly IIdentityModule _identity;

    public GetNotificationPreferencesHandler(IIdentityModule identity)
    {
        _identity = identity;
    }

    public Task<NotificationPreferencesDto> HandleAsync(
        GetNotificationPreferencesQuery query,
        CancellationToken ct = default) =>
        _identity.GetNotificationPreferencesAsync(query.UserId, ct);
}
