using Microsoft.Extensions.Options;

namespace juskel.Integrations.BlobStorage;

public sealed class LocalBlobStorage : IBlobStorage
{
    private readonly string _rootPath;

    public LocalBlobStorage(IOptions<BlobStorageOptions> options)
    {
        _rootPath = Path.GetFullPath(options.Value.LocalRootPath);
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> UploadAsync(
        string blobPath,
        Stream content,
        string contentType,
        CancellationToken ct = default)
    {
        _ = contentType;
        var fullPath = GetFullPath(blobPath);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var file = File.Create(fullPath);
        await content.CopyToAsync(file, ct);
        return blobPath;
    }

    public Task DeleteAsync(string blobPath, CancellationToken ct = default)
    {
        _ = ct;
        var fullPath = GetFullPath(blobPath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }

    public Task<Stream?> OpenReadAsync(string blobPath, CancellationToken ct = default)
    {
        _ = ct;
        var fullPath = GetFullPath(blobPath);
        Stream? stream = File.Exists(fullPath) ? File.OpenRead(fullPath) : null;
        return Task.FromResult(stream);
    }

    private string GetFullPath(string blobPath)
    {
        var normalized = blobPath.Replace('\\', '/').TrimStart('/');
        var combined = Path.GetFullPath(Path.Combine(_rootPath, normalized));
        if (!combined.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Invalid blob path.");

        return combined;
    }
}
