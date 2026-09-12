using identity.Contracts;
using notifications.Contracts;
using notifications.Core.Channels;

namespace notifications.Core.Gateway;

internal sealed class NotificationGateway : INotificationModule
{
    private readonly IIdentityModule _identity;
    private readonly InAppChannel _inApp;
    private readonly EmailChannel _email;

    public NotificationGateway(
        IIdentityModule identity,
        InAppChannel inApp,
        EmailChannel email)
    {
        _identity = identity;
        _inApp = inApp;
        _email = email;
    }

    public async Task<NotifyResult> NotifyAsync(NotifyCommand command, CancellationToken ct = default)
    {
        try
        {
            var requested = command.RequestedChannels is { Count: > 0 }
                ? command.RequestedChannels
                : ProductNotifications.DefaultChannels;

            var prefs = await _identity.GetNotificationPreferencesAsync(command.UserId, ct);
            var allowed = PreferenceFilter.Apply(prefs, command.Category, requested);

            if (allowed.Count == 0)
                return new NotifyResult(Skipped: true);

            ChannelDeliveryResult? inAppResult = null;
            ChannelDeliveryResult? emailResult = null;
            Guid? inboxItemId = null;

            if (allowed.Contains(NotificationChannel.InApp))
            {
                try
                {
                    var delivered = await _inApp.DeliverAsync(command, ct);
                    inAppResult = delivered.Result;
                    inboxItemId = delivered.InboxItemId;
                }
                catch (Exception ex)
                {
                    inAppResult = new ChannelDeliveryResult(false, false, ex.Message);
                }
            }

            if (allowed.Contains(NotificationChannel.Email))
            {
                try
                {
                    emailResult = await _email.DeliverAsync(command, ct);
                    if (emailResult.Success && inboxItemId is Guid id)
                        await _inApp.MarkEmailDeliveredAsync(id, ct);
                }
                catch (Exception ex)
                {
                    emailResult = new ChannelDeliveryResult(false, false, ex.Message);
                }
            }

            return new NotifyResult(Skipped: false, inAppResult, emailResult);
        }
        catch (Exception)
        {
            return new NotifyResult(Skipped: true);
        }
    }
}
