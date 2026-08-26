namespace juskel.Integrations.BlobStorage;

public sealed class BlobStorageOptions
{
    public const string SectionName = "Integrations:BlobStorage";

    public string Provider { get; set; } = "Local";

    public string LocalRootPath { get; set; } = "uploads";

    public string AzureConnectionString { get; set; } = string.Empty;

    public string AzureContainerName { get; set; } = "evidence";
}
