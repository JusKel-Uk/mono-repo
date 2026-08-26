namespace juskel.Integrations.BlobStorage;

public interface IBlobStorage
{
    Task<string> UploadAsync(
        string blobPath,
        Stream content,
        string contentType,
        CancellationToken ct = default);

    Task DeleteAsync(string blobPath, CancellationToken ct = default);

    Task<Stream?> OpenReadAsync(string blobPath, CancellationToken ct = default);
}
