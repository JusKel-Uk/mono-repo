using identity.Contracts;
using juskel.Shared;
using juskel.Shared.Email;
using Microsoft.Extensions.Options;
using notifications.Contracts;

namespace notifications.Core.Channels;

internal sealed class EmailChannel
{
    private readonly IEmailSender _emailSender;
    private readonly IEmailTemplateRenderer _templateRenderer;
    private readonly IIdentityModule _identity;
    private readonly JuskelAppOptions _app;

    public EmailChannel(
        IEmailSender emailSender,
        IEmailTemplateRenderer templateRenderer,
        IIdentityModule identity,
        IOptions<JuskelAppOptions> app)
    {
        _emailSender = emailSender;
        _templateRenderer = templateRenderer;
        _identity = identity;
        _app = app.Value;
    }

    public async Task<ChannelDeliveryResult> DeliverAsync(
        NotifyCommand command,
        CancellationToken ct)
    {
        var user = await _identity.GetUserAsync(command.UserId, ct);
        if (user is null || string.IsNullOrWhiteSpace(user.Email))
            return new ChannelDeliveryResult(false, false, "No email address available for user.");

        var settingsUrl = string.IsNullOrWhiteSpace(_app.FrontendUrl)
            ? "/sme/settings"
            : $"{_app.FrontendUrl.TrimEnd('/')}/sme/settings";

        var htmlBody = _templateRenderer.Render(EmailTemplates.ProductNotification, new Dictionary<string, string>
        {
            ["Subject"] = command.Title,
            ["Preheader"] = command.Body,
            ["Headline"] = command.Title,
            ["IntroText"] = command.Body,
            ["UnsubscribeUrl"] = settingsUrl,
        });

        await _emailSender.SendAsync(
            new EmailMessage(user.Email, command.Title, htmlBody),
            ct);

        return new ChannelDeliveryResult(true, false);
    }
}
