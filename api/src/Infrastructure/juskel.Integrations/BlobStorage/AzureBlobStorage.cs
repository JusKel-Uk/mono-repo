using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;

namespace juskel.Integrations.BlobStorage;

public sealed class AzureBlobStorage : IBlobStorage
{
    private readonly BlobContainerClient _container;

    public AzureBlobStorage(IOptions<BlobStorageOptions> options)
    {
        var blobOptions = options.Value;
        if (string.IsNullOrWhiteSpace(blobOptions.AzureConnectionString))
            throw new InvalidOperationException("Azure blob connection string is not configured.");

        var serviceClient = new BlobServiceClient(blobOptions.AzureConnectionString);
        _container = serviceClient.GetBlobContainerClient(blobOptions.AzureContainerName);
        _container.CreateIfNotExists();
    }

    public async Task<string> UploadAsync(
        string blobPath,
        Stream content,
        string contentType,
        CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(blobPath);
        await blob.UploadAsync(content, new BlobHttpHeaders { ContentType = contentType }, cancellationToken: ct);
        return blobPath;
    }

    public async Task DeleteAsync(string blobPath, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(blobPath);
        await blob.DeleteIfExistsAsync(cancellationToken: ct);
    }

    public async Task<Stream?> OpenReadAsync(string blobPath, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(blobPath);
        if (!await blob.ExistsAsync(ct))
            return null;

        var response = await blob.DownloadStreamingAsync(cancellationToken: ct);
        return response.Value.Content;
    }
}
