using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;

var assembly = Assembly.Load("NETGRID");
var discovery = assembly.GetType("Netgrid.Launcher.UpdateDiscovery", throwOnError: true)!;
var candidateType = assembly.GetType("Netgrid.Launcher.UpdateCandidate", throwOnError: true)!;
var scratch = Path.Combine(Path.GetTempPath(), $"NETGRID-Download-Test-{Guid.NewGuid():N}");
Directory.CreateDirectory(scratch);
var body = Encoding.UTF8.GetBytes("NETGRID inert download regression fixture");
var hash = Convert.ToHexString(SHA256.HashData(body)).ToLowerInvariant();
const string name = "NETGRID-Setup-1.0.2-x64.exe";
var destination = Path.Combine(scratch, name);
try
{
    using var http = new HttpClient(new FixtureHandler(body));
    var downloaded = await Download(hash);
    Assert(downloaded == destination, "download_destination");
    Assert(File.ReadAllBytes(destination).SequenceEqual(body), "download_bytes_verified");
    Assert(!Directory.EnumerateFiles(scratch, "*.partial").Any(), "verified_download_has_no_partial");
    // Returning the candidate must release all handles before the updater owns it.
    using (File.Open(destination, FileMode.Open, FileAccess.ReadWrite, FileShare.None)) { }
    try
    {
        await Download(new string('0', 64));
        throw new Exception("tampered_download_accepted");
    }
    catch (InvalidOperationException exception) when (exception.Message == "update_download_hash_mismatch") { }
    Assert(File.ReadAllBytes(destination).SequenceEqual(body), "failed_download_preserves_verified_file");
    Assert(!Directory.EnumerateFiles(scratch, "*.partial").Any(), "rejected_download_has_no_partial");
    Assert(await Download(hash) == destination, "verified_replacement_succeeds");
    Console.WriteLine("LAUNCHER_DOWNLOAD_TESTS_OK verified=published rejected=preserved partials=removed windowsCreated=0");

    async Task<string> Download(string expectedHash)
    {
        var candidate = Activator.CreateInstance(candidateType, ["1.0.2", false, "NETGRID", "", name, "https://github.com/LevelX2/NETGRID/releases/download/v1.0.2/" + name, expectedHash])!;
        return await (Task<string>)discovery.GetMethod("DownloadVerifiedAsync")!.Invoke(null, [http, candidate, scratch])!;
    }
}
finally
{
    // Only this freshly generated test directory is eligible for removal.
    var resolved = Path.GetFullPath(scratch);
    if (Path.GetDirectoryName(resolved) != Path.TrimEndingDirectorySeparator(Path.GetFullPath(Path.GetTempPath())) || !Path.GetFileName(resolved).StartsWith("NETGRID-Download-Test-", StringComparison.Ordinal))
        throw new Exception("download_test_cleanup_scope_invalid");
    Directory.Delete(resolved, recursive: true);
}

static void Assert(bool condition, string name)
{
    if (!condition) throw new Exception($"launcher_download_test_failed:{name}");
}

sealed class FixtureHandler(byte[] body) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.RequestUri?.Host != "github.com") throw new Exception("unexpected_fixture_request");
        return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(body) });
    }
}
