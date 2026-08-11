using juskel.Shared.Email;
using Microsoft.Extensions.Logging;

namespace juskel.Email;

internal sealed class ConsoleEmailSender : IEmailSender
{
    private readonly ILogger<ConsoleEmailSender> _logger;

    public ConsoleEmailSender(ILogger<ConsoleEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "EMAIL [Console] To={To} | Subject={Subject} | HtmlLength={Length}",
            message.To,
            message.Subject,
            message.HtmlBody.Length);

        _logger.LogDebug("EMAIL [Console] Body:\n{Html}", message.HtmlBody);

        return Task.CompletedTask;
    }
}
