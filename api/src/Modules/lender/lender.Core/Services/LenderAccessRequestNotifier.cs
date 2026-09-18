using juskel.Shared;
using juskel.Shared.Email;
using lender.Core.Entities;
using lender.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace lender.Core.Services;

internal interface ILenderAccessRequestNotifier
{
    Task NotifyAdminAsync(LenderAccessRequest request, CancellationToken ct = default);

    Task SendApprovalInviteAsync(
        LenderAccessRequest request,
        LenderOrganisation organisation,
        string inviteToken,
        CancellationToken ct = default);

    Task SendRejectionAsync(
        LenderAccessRequest request,
        string? reason,
        CancellationToken ct = default);
}

internal sealed class LenderAccessRequestNotifier : ILenderAccessRequestNotifier
{
    public const string CreateAccountPath = "/lender/create-account";

    private readonly IEmailSender _emailSender;
    private readonly IEmailTemplateRenderer _templateRenderer;
    private readonly JuskelAppOptions _appOptions;
    private readonly LenderAdminOptions _adminOptions;
    private readonly ILogger<LenderAccessRequestNotifier> _logger;

    public LenderAccessRequestNotifier(
        IEmailSender emailSender,
        IEmailTemplateRenderer templateRenderer,
        IOptions<JuskelAppOptions> appOptions,
        IOptions<LenderAdminOptions> adminOptions,
        ILogger<LenderAccessRequestNotifier> logger)
    {
        _emailSender = emailSender;
        _templateRenderer = templateRenderer;
        _appOptions = appOptions.Value;
        _adminOptions = adminOptions.Value;
        _logger = logger;
    }

    public async Task NotifyAdminAsync(LenderAccessRequest request, CancellationToken ct = default)
    {
        var adminEmail = _adminOptions.AdminNotificationEmail;
        if (string.IsNullOrWhiteSpace(adminEmail))
        {
            _logger.LogInformation(
                "New lender access request {RequestId} from {Organisation} — configure Lender:AdminNotificationEmail to email admins.",
                request.Id,
                request.Organisation);
            return;
        }

        var htmlBody = _templateRenderer.Render(EmailTemplates.ProductNotification, new Dictionary<string, string>
        {
            ["Subject"] = "New lender access request",
            ["Preheader"] = $"{request.Organisation} requested lender portal access",
            ["Headline"] = "Lender access request",
            ["IntroText"] =
                $"{request.FirstName} {request.LastName} ({request.WorkEmail}) from {request.Organisation} requested access to the JusKel Lender Portal.",
        });

        try
        {
            await _emailSender.SendAsync(
                new EmailMessage(adminEmail, "New lender access request", htmlBody),
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Admin notification failed for lender access request {RequestId}", request.Id);
        }
    }

    public async Task SendApprovalInviteAsync(
        LenderAccessRequest request,
        LenderOrganisation organisation,
        string inviteToken,
        CancellationToken ct = default)
    {
        var createAccountUrl = BuildCreateAccountUrl(_appOptions.FrontendUrl, inviteToken);
        var htmlBody = _templateRenderer.Render(EmailTemplates.LenderAccessApproved, new Dictionary<string, string>
        {
            ["Subject"] = "Your JusKel Lender Portal access is approved",
            ["Preheader"] = $"Create your account for {organisation.Name}",
            ["Headline"] = "Lender access approved",
            ["IntroText"] =
                $"Your request to access the JusKel Lender Portal for {organisation.Name} has been approved.",
            ["CreateAccountUrl"] = createAccountUrl,
            ["ExpiryDays"] = LenderInvite.ExpiryDays.ToString(),
        });

        try
        {
            await _emailSender.SendAsync(
                new EmailMessage(
                    request.WorkEmail,
                    "Your JusKel Lender Portal access is approved",
                    htmlBody),
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Approval invite email failed for {Email}; invite is persisted.",
                request.WorkEmail);
        }
    }

    public async Task SendRejectionAsync(
        LenderAccessRequest request,
        string? reason,
        CancellationToken ct = default)
    {
        var reasonText = string.IsNullOrWhiteSpace(reason)
            ? "We are unable to approve your request at this time."
            : reason.Trim();

        var htmlBody = _templateRenderer.Render(EmailTemplates.ProductNotification, new Dictionary<string, string>
        {
            ["Subject"] = "Update on your JusKel Lender Portal request",
            ["Preheader"] = "Your lender access request was not approved",
            ["Headline"] = "Lender access request update",
            ["IntroText"] =
                $"Thank you for your interest in the JusKel Lender Portal. {reasonText} " +
                "If you believe this was a mistake, contact hello@juskel.co.uk.",
        });

        try
        {
            await _emailSender.SendAsync(
                new EmailMessage(
                    request.WorkEmail,
                    "Update on your JusKel Lender Portal request",
                    htmlBody),
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Rejection email failed for {Email}", request.WorkEmail);
        }
    }

    internal static string BuildCreateAccountUrl(string frontendUrl, string inviteToken)
    {
        var baseUrl = string.IsNullOrWhiteSpace(frontendUrl)
            ? "https://mono-repo-n96q.vercel.app"
            : frontendUrl.TrimEnd('/');

        return $"{baseUrl}{CreateAccountPath}?token={Uri.EscapeDataString(inviteToken)}";
    }
}
