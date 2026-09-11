using identity.Contracts;
using identity.Core.Entities;
using juskel.Shared;
using juskel.Shared.Email;
using Microsoft.Extensions.Options;

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
    public const string AcceptInvitePath = "/accept-invite";

    private readonly IEmailSender _emailSender;
    private readonly IEmailTemplateRenderer _templateRenderer;
    private readonly JuskelAppOptions _appOptions;

    public OrganisationInviteNotifier(
        IEmailSender emailSender,
        IEmailTemplateRenderer templateRenderer,
        IOptions<JuskelAppOptions> appOptions)
    {
        _emailSender = emailSender;
        _templateRenderer = templateRenderer;
        _appOptions = appOptions.Value;
    }

    public async Task SendInviteAsync(
        User inviter,
        Organisation organisation,
        string inviteeEmail,
        OrganisationRole role,
        string acceptToken,
        CancellationToken ct = default)
    {
        var acceptInviteUrl = BuildAcceptInviteUrl(_appOptions.FrontendUrl);
        var htmlBody = _templateRenderer.Render(EmailTemplates.OrganisationInvite, new Dictionary<string, string>
        {
            ["Subject"] = $"Join {organisation.Name} on JusKel",
            ["Preheader"] = $"{inviter.FirstName} invited you to join {organisation.Name}",
            ["Headline"] = "Team invitation",
            ["IntroText"] =
                $"{inviter.FirstName} {inviter.LastName} invited you to join {organisation.Name} as {role}. " +
                "Use the 6-digit code below, then open the link to enter it.",
            ["OtpCode"] = OtpCodes.FormatForDisplay(acceptToken),
            ["ExpiryDays"] = OrganisationInvite.ExpiryDays.ToString(),
            ["AcceptInviteUrl"] = acceptInviteUrl,
        });

        await _emailSender.SendAsync(
            new EmailMessage(inviteeEmail, $"Join {organisation.Name} on JusKel", htmlBody),
            ct);
    }

    internal static string BuildAcceptInviteUrl(string frontendUrl)
    {
        var baseUrl = string.IsNullOrWhiteSpace(frontendUrl)
            ? "https://mono-repo-n96q.vercel.app"
            : frontendUrl.TrimEnd('/');

        return $"{baseUrl}{AcceptInvitePath}";
    }
}
