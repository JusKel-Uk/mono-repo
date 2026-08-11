using System.Globalization;
using juskel.Shared.Email;
using Microsoft.Extensions.Options;

namespace juskel.Email;

internal sealed class FileEmailTemplateRenderer : IEmailTemplateRenderer
{
    private readonly string _templatesPath;
    private readonly EmailOptions _emailOptions;

    public FileEmailTemplateRenderer(IOptions<EmailOptions> emailOptions)
    {
        _templatesPath = Path.Combine(AppContext.BaseDirectory, "Templates");
        _emailOptions = emailOptions.Value;
    }

    public string Render(string templateName, IReadOnlyDictionary<string, string> tokens)
    {
        var layout = LoadTemplate("_layout.html");
        var bodyTemplate = LoadTemplate($"{templateName}.html");

        var merged = new Dictionary<string, string>(tokens, StringComparer.OrdinalIgnoreCase);
        ApplyDefaultTokens(merged);

        merged["BodyContent"] = ReplaceTokens(bodyTemplate, merged);

        return ReplaceTokens(layout, merged);
    }

    private void ApplyDefaultTokens(Dictionary<string, string> merged)
    {
        merged.TryAdd("Year", DateTime.UtcNow.Year.ToString(CultureInfo.InvariantCulture));
        merged.TryAdd("AssetsBaseUrl", _emailOptions.AssetsBaseUrl.TrimEnd('/'));
        merged.TryAdd("WebsiteUrl", _emailOptions.WebsiteUrl);
        merged.TryAdd("SupportUrl", _emailOptions.SupportUrl);
        merged.TryAdd("TermsUrl", _emailOptions.TermsUrl);
        merged.TryAdd("PrivacyUrl", _emailOptions.PrivacyUrl);
        merged.TryAdd("UnsubscribeUrl", _emailOptions.UnsubscribeUrl);
    }

    private string LoadTemplate(string fileName)
    {
        var path = Path.Combine(_templatesPath, fileName);

        if (!File.Exists(path))
            throw new FileNotFoundException($"Email template not found: {fileName}", path);

        return File.ReadAllText(path);
    }

    private static string ReplaceTokens(string template, IReadOnlyDictionary<string, string> tokens)
    {
        var result = template;

        foreach (var (key, value) in tokens)
            result = result.Replace($"{{{{{key}}}}}", value, StringComparison.Ordinal);

        return result;
    }
}
