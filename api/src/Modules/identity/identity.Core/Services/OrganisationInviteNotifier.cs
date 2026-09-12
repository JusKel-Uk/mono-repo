using identity.Contracts;
using identity.Core.Entities;
using juskel.Shared;
using juskel.Shared.Email;
using Microsoft.Extensions.Logging;
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
    private readonly ILogger<OrganisationInviteNotifier> _logger;

    public OrganisationInviteNotifier(
        IEmailSender emailSender,
        IEmailTemplateRenderer templateRenderer,
        IOptions<JuskelAppOptions> appOptions,
        ILogger<OrganisationInviteNotifier> logger)
    {
        _emailSender = emailSender;
        _templateRenderer = templateRenderer;
        _appOptions = appOptions.Value;
        _logger = logger;
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
                "Enter the 6-digit code once on the page, then create an account or sign in — you will not need this email again.",
            ["OtpCode"] = OtpCodes.FormatForDisplay(acceptToken),
            ["ExpiryDays"] = OrganisationInvite.ExpiryDays.ToString(),
            ["AcceptInviteUrl"] = acceptInviteUrl,
        });

        try
        {
            await _emailSender.SendAsync(
                new EmailMessage(inviteeEmail, $"Join {organisation.Name} on JusKel", htmlBody),
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Invite email failed for {Email}; invite is persisted and can be resent.",
                inviteeEmail);
        }
    }

    internal static string BuildAcceptInviteUrl(string frontendUrl)
    {
        var baseUrl = string.IsNullOrWhiteSpace(frontendUrl)
            ? "https://mono-repo-n96q.vercel.app"
            : frontendUrl.TrimEnd('/');

        return $"{baseUrl}{AcceptInvitePath}";
    }
}
