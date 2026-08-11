using juskel.Shared.Email;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace juskel.Email;

public static class DependencyInjection
{
    public static IServiceCollection AddEmail(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        services.Configure<ResendOptions>(configuration.GetSection(ResendOptions.SectionName));
        services.AddSingleton<IEmailTemplateRenderer, FileEmailTemplateRenderer>();

        var provider = configuration[$"{EmailOptions.SectionName}:Provider"];

        if (string.Equals(provider, "Resend", StringComparison.OrdinalIgnoreCase))
        {
            services.AddHttpClient<IEmailSender, ResendEmailSender>(client =>
            {
                client.BaseAddress = new Uri("https://api.resend.com/");
            });
        }
        else
        {
            services.AddSingleton<IEmailSender, ConsoleEmailSender>();
        }

        return services;
    }
}
