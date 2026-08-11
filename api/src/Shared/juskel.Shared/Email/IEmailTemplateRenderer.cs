namespace juskel.Shared.Email;

public interface IEmailTemplateRenderer
{
    string Render(string templateName, IReadOnlyDictionary<string, string> tokens);
}