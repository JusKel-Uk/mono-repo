namespace juskel.Integrations.CompaniesHouse;

public interface ICompaniesHouseClient
{
    Task<CompanyLookupResult?> LookupCompanyAsync(
        string companyNumber,
        CancellationToken ct = default);
}
