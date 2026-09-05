using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Netgrid.Launcher;

internal sealed record UpdateCandidate(
    string Version,
    bool Prerelease,
    string ReleaseName,
    string ReleaseNotes,
    string SetupName,
    string SetupUrl,
    string SetupSha256
);

internal static class UpdateDiscovery
{
    public static readonly Uri GitHubReleasesApi = new("https://api.github.com/repos/LevelX2/NETGRID/releases");

    public static HttpClient CreateHttpClient()
    {
        var client = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
        client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("NETGRID-Updater", "1.0"));
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        return client;
    }

    public static async Task<UpdateCandidate?> CheckAsync(HttpClient http, Uri releasesApi, string currentVersion, bool allowPrerelease)
    {
        var current = ParseVersion(currentVersion);
        using var response = await http.GetAsync(releasesApi);
        response.EnsureSuccessStatusCode();
        var releases = await response.Content.ReadFromJsonAsync<List<GitHubRelease>>()
            ?? throw new InvalidOperationException("update_release_response_invalid");
        var candidates = releases
            .Where(item => !item.Draft && (allowPrerelease || !item.Prerelease))
            .Select(item => (Release: item, Version: TryParseVersion(item.TagName, out var parsed) ? parsed : null))
            .Where(item => item.Version is not null && item.Version > current)
            .OrderByDescending(item => item.Version);
        foreach (var candidate in candidates)
        {
            var release = candidate.Release;
            var version = candidate.Version!;
            var setup = release.Assets.SingleOrDefault(asset => asset.Name.StartsWith("NETGRID-Setup-", StringComparison.OrdinalIgnoreCase) && asset.Name.EndsWith("-x64.exe", StringComparison.OrdinalIgnoreCase));
            var checksums = release.Assets.SingleOrDefault(asset => asset.Name.Equals("SHA256SUMS.txt", StringComparison.OrdinalIgnoreCase));
            var metadata = release.Assets.SingleOrDefault(asset => asset.Name.Equals("release-metadata.json", StringComparison.OrdinalIgnoreCase));
            if (setup is null || checksums is null || metadata is null) continue;
            if (releasesApi == GitHubReleasesApi)
                foreach (var asset in new[] { setup, checksums, metadata }) EnsureGitHubAsset(asset.DownloadUrl);
            var checksumText = await http.GetStringAsync(checksums.DownloadUrl);
            var checksum = ParseChecksum(checksumText, setup.Name);
            var metadataText = await http.GetStringAsync(metadata.DownloadUrl);
            var releaseMetadata = JsonSerializer.Deserialize<ReleaseMetadata>(metadataText, JsonOptions)
                ?? throw new InvalidOperationException("update_metadata_invalid");
            var metadataArtifact = releaseMetadata.Artifacts.SingleOrDefault(artifact => artifact.Name.Equals(setup.Name, StringComparison.OrdinalIgnoreCase));
            if (releaseMetadata.SchemaVersion != "netgrid-windows-installer-release-v1" || releaseMetadata.Product?.InstallerVersion != version.ToString() || metadataArtifact is null || !ValidHash(metadataArtifact.Sha256))
                throw new InvalidOperationException("update_metadata_invalid");
            if (!checksum.Equals(metadataArtifact.Sha256, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("update_integrity_sources_disagree");
            return new UpdateCandidate(version.ToString(), release.Prerelease, string.IsNullOrWhiteSpace(release.Name) ? release.TagName : release.Name, TrimNotes(release.Body), setup.Name, setup.DownloadUrl, checksum.ToLowerInvariant());
        }
        return null;
    }

    public static async Task<string> DownloadVerifiedAsync(HttpClient http, UpdateCandidate candidate, string destinationDirectory)
    {
        Directory.CreateDirectory(destinationDirectory);
        var destination = Path.Combine(destinationDirectory, candidate.SetupName);
        var temporary = $"{destination}.{Guid.NewGuid():N}.partial";
        try
        {
            await using (var input = await http.GetStreamAsync(candidate.SetupUrl))
            await using (var output = File.Create(temporary)) await input.CopyToAsync(output);
            await using (var verify = File.OpenRead(temporary))
            {
                var actual = Convert.ToHexString(await SHA256.HashDataAsync(verify)).ToLowerInvariant();
                if (!actual.Equals(candidate.SetupSha256, StringComparison.Ordinal))
                    throw new InvalidOperationException("update_download_hash_mismatch");
            }
            // Windows must release the verification handle before publication.
            File.Move(temporary, destination, overwrite: true);
            return destination;
        }
        finally
        {
            if (File.Exists(temporary)) File.Delete(temporary);
        }
    }

    private static string ParseChecksum(string text, string fileName)
    {
        foreach (var line in text.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = line.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 2 && parts[1].TrimStart('*').Equals(fileName, StringComparison.OrdinalIgnoreCase) && ValidHash(parts[0])) return parts[0];
        }
        throw new InvalidOperationException("update_checksum_missing");
    }

    private static Version ParseVersion(string value) => TryParseVersion(value, out var version)
        ? version
        : throw new InvalidOperationException("update_current_version_invalid");

    private static bool TryParseVersion(string value, out Version version)
    {
        var normalized = value.Trim().TrimStart('v', 'V');
        return Version.TryParse(normalized, out version!);
    }

    private static bool ValidHash(string value) => value.Length == 64 && value.All(character => Uri.IsHexDigit(character));
    private static string TrimNotes(string? value)
    {
        var notes = value?.Trim() ?? string.Empty;
        return notes.Length <= 3000 ? notes : $"{notes[..3000]}…";
    }

    private static void EnsureGitHubAsset(string value)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps || uri.Host is not ("github.com" or "objects.githubusercontent.com"))
            throw new InvalidOperationException("update_asset_origin_invalid");
    }

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private sealed record GitHubRelease(
        [property: JsonPropertyName("tag_name")] string TagName,
        string? Name,
        string? Body,
        bool Draft,
        bool Prerelease,
        List<GitHubAsset> Assets
    );

    private sealed record GitHubAsset(string Name, [property: JsonPropertyName("browser_download_url")] string DownloadUrl);
    private sealed record ReleaseMetadata(string SchemaVersion, ReleaseProduct? Product, List<ReleaseArtifact> Artifacts);
    private sealed record ReleaseProduct(string InstallerVersion);
    private sealed record ReleaseArtifact(string Name, string Sha256);
}
