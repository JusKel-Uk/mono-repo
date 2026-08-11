using System.Net.Http.Headers;
using System.Net.Http.Json;
using juskel.Shared.Email;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace juskel.Email;

internal sealed class ResendEmailSender : IEmailSender
{
    private readonly HttpClient _http;
    private readonly EmailOptions _emailOptions;
    private readonly ResendOptions _resendOptions;
    private readonly ILogger<ResendEmailSender> _logger;

    public ResendEmailSender(
        HttpClient http,
        IOptions<EmailOptions> emailOptions,
        IOptions<ResendOptions> resendOptions,
        ILogger<ResendEmailSender> logger)
    {
        _http = http;
        _emailOptions = emailOptions.Value;
        _resendOptions = resendOptions.Value;
        _logger = logger;
    }

    public async Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_resendOptions.ApiKey))
            throw new InvalidOperationException("Email:Resend:ApiKey is not configured.");

        if (string.IsNullOrWhiteSpace(_emailOptions.DefaultFrom))
            throw new InvalidOperationException("Email:DefaultFrom is not configured.");

        using var request = new HttpRequestMessage(HttpMethod.Post, "/emails");
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", _resendOptions.ApiKey);

        request.Content = JsonContent.Create(new ResendSendRequest
        {
            From = _emailOptions.DefaultFrom,
            To = [message.To],
            Subject = message.Subject,
            Html = message.HtmlBody
        });

        var response = await _http.SendAsync(request, ct);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError(
                "Resend send failed. Status={StatusCode} Body={Body}",
                (int)response.StatusCode,
                body);
            throw new InvalidOperationException(
                $"Failed to send email via Resend (HTTP {(int)response.StatusCode}).");
        }
    }

    private sealed class ResendSendRequest
    {
        public string From { get; init; } = string.Empty;

        public string[] To { get; init; } = [];

        public string Subject { get; init; } = string.Empty;

        public string Html { get; init; } = string.Empty;
    }
}
