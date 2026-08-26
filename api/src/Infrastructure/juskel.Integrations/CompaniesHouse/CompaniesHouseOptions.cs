namespace juskel.Integrations.CompaniesHouse;

public sealed class CompaniesHouseOptions
{
    public const string SectionName = "Integrations:CompaniesHouse";

    public string ApiKey { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://api.company-information.service.gov.uk";
}
