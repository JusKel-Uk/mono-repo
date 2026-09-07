using identity.Contracts;
using identity.Core.Entities;
using juskel.Shared.Email;

namespace identity.Core.Services;

internal interface IOrganisationInviteNotifier
{
    Task SendInviteAsync(
        User inviter,
        Organisation organisation,
        string inviteeEmail,
        OrganisationRole role,
        string acceptToken,
        CancellationToken ct = default);
}

internal sealed class OrganisationInviteNotifier : IOrganisationInviteNotifier
{
    private readonly IEmailSender _emailSender;
    private readonly IEmailTemplateRenderer _templateRenderer;

    public OrganisationInviteNotifier(
        IEmailSender emailSender,
        IEmailTemplateRenderer templateRenderer)
    {
        _emailSender = emailSender;
        _templateRenderer = templateRenderer;
    }

    public async Task SendInviteAsync(
        User inviter,
        Organisation organisation,
        string inviteeEmail,
        identity.Contracts.OrganisationRole role,
        string acceptToken,
        CancellationToken ct = default)
    {
        var htmlBody = _templateRenderer.Render(EmailTemplates.OtpVerification, new Dictionary<string, string>
        {
            ["Subject"] = $"Join {organisation.Name} on JusKel",
            ["Preheader"] = $"{inviter.FirstName} invited you to join {organisation.Name}",
            ["Headline"] = "Team invitation",
            ["IntroText"] =
                $"{inviter.FirstName} {inviter.LastName} invited you to join {organisation.Name} as {role}. " +
                $"Use this token to accept: {acceptToken}",
            ["OtpCode"] = acceptToken,
            ["ExpiryMinutes"] = "168",
        });

        await _emailSender.SendAsync(
            new EmailMessage(inviteeEmail, $"Join {organisation.Name} on JusKel", htmlBody),
            ct);
    }
}
