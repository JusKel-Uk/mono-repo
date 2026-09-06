using identity.Core.Entities;
using juskel.Shared.Email;

namespace identity.Core.Services;

internal interface IPasswordResetNotifier
{
    Task SendResetOtpAsync(User user, string otpDisplayCode, CancellationToken ct = default);
}

internal sealed class PasswordResetNotifier : IPasswordResetNotifier
{
    private readonly IEmailSender _emailSender;
    private readonly IEmailTemplateRenderer _templateRenderer;

    public PasswordResetNotifier(
        IEmailSender emailSender,
        IEmailTemplateRenderer templateRenderer)
    {
        _emailSender = emailSender;
        _templateRenderer = templateRenderer;
    }

    public async Task SendResetOtpAsync(
        User user,
        string otpDisplayCode,
        CancellationToken ct = default)
    {
        var htmlBody = _templateRenderer.Render(EmailTemplates.PasswordResetOtp, new Dictionary<string, string>
        {
            ["Subject"] = "Reset your JusKel password",
            ["Preheader"] = $"Your password reset code is {otpDisplayCode}",
            ["Headline"] = "Reset your password",
            ["IntroText"] =
                $"Hi {user.FirstName}, use the one-time code below to reset your JusKel password:",
            ["OtpCode"] = otpDisplayCode,
            ["ExpiryMinutes"] = "10"
        });

        await _emailSender.SendAsync(
            new EmailMessage(user.Email, "Reset your JusKel password", htmlBody),
            ct);
    }
}
