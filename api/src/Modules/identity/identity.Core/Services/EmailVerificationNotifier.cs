using identity.Core.Entities;
using juskel.Shared.Email;

namespace identity.Core.Services;

internal interface IEmailVerificationNotifier
{
    Task SendVerificationOtpAsync(User user, string otpDisplayCode, CancellationToken ct = default);
}

internal sealed class EmailVerificationNotifier : IEmailVerificationNotifier
{
    private readonly IEmailSender _emailSender;
    private readonly IEmailTemplateRenderer _templateRenderer;

    public EmailVerificationNotifier(
        IEmailSender emailSender,
        IEmailTemplateRenderer templateRenderer)
    {
        _emailSender = emailSender;
        _templateRenderer = templateRenderer;
    }

    public async Task SendVerificationOtpAsync(
        User user,
        string otpDisplayCode,
        CancellationToken ct = default)
    {
        var htmlBody = _templateRenderer.Render(EmailTemplates.OtpVerification, new Dictionary<string, string>
        {
            ["Subject"] = "Verify your JusKel email",
            ["Preheader"] = $"Your verification code is {otpDisplayCode}",
            ["Headline"] = "Verify your email",
            ["IntroText"] = $"Thanks for signing up, {user.FirstName}. Use the one-time verification code below to verify your JusKel account:",
            ["OtpCode"] = otpDisplayCode,
            ["ExpiryMinutes"] = "10"
        });

        await _emailSender.SendAsync(
            new EmailMessage(user.Email, "Verify your JusKel email", htmlBody),
            ct);
    }
}
