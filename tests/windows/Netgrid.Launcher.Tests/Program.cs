using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;

if (await TransferPeerFixture.TryChildAsync(args)) return;
if (await MsiPeerFixture.TryChildAsync(args)) return;

if (args is ["--update-stop-child-fails"])
{
    Console.WriteLine("READY");
    await Console.In.ReadLineAsync();
    Environment.ExitCode = 7;
    return;
}
if (args is ["--update-stop-child-ignore"])
{
    Console.WriteLine("READY");
    await Task.Delay(Timeout.Infinite);
    return;
}
if (args is ["--installation-stop-child"])
{
    Console.WriteLine("READY");
    Environment.ExitCode = await Console.In.ReadLineAsync() == "shutdown" ? 0 : 2;
    return;
}

var assembly = Assembly.Load("NETGRID");
if (args is ["--check-notices-dialog"])
{
    Console.WriteLine($"LAUNCHER_NOTICES_DIALOG_TESTS_OK checks={NoticesDialogTests.Run(assembly)} windowsVisible=0 shellAssociationUsed=false");
    return;
}
Console.WriteLine($"LAUNCHER_HEADLESS_VERIFICATION_TESTS_OK checks={await HeadlessVerificationTests.Run(assembly)} runtimeStarted=false");
Console.WriteLine($"LAUNCHER_LAUNCH_FENCE_TESTS_OK checks={await LaunchFenceTests.Run(assembly)} runtimeStarted=false");
Console.WriteLine($"LAUNCHER_VERIFICATION_OPTIONS_TESTS_OK checks={VerificationOptionsTests.Run(assembly)}");
Console.WriteLine($"LAUNCHER_UPDATER_STAGING_TESTS_OK checks={await StagedUpdaterTests.Run(assembly)} installationStarted=false");
if (args is ["--check-update-preparation"])
{
    Console.WriteLine($"LAUNCHER_UPDATE_PREPARATION_TESTS_OK checks={await UpdatePreparationTests.Run(assembly)}");
    Console.WriteLine($"LAUNCHER_RUNTIME_PREPARATION_TESTS_OK checks={await RuntimePreparationTests.Run(assembly)}");
    return;
}
if (args is ["--check-installation-stop"])
{
    Console.WriteLine($"LAUNCHER_INSTALLATION_STOP_TESTS_OK checks={await InstallationStopTests.Run(assembly)}");
    Console.WriteLine($"LAUNCHER_STOP_OWNERSHIP_TESTS_OK checks={await StopOwnershipTests.Run(assembly)}");
    return;
}
Console.WriteLine($"LAUNCHER_INSTALLATION_STOP_TESTS_OK checks={await InstallationStopTests.Run(assembly)}");
Console.WriteLine($"LAUNCHER_STOP_OWNERSHIP_TESTS_OK checks={await StopOwnershipTests.Run(assembly)}");
Console.WriteLine($"LAUNCHER_UPDATE_PREPARATION_TESTS_OK checks={await UpdatePreparationTests.Run(assembly)}");
Console.WriteLine($"LAUNCHER_RUNTIME_PREPARATION_TESTS_OK checks={await RuntimePreparationTests.Run(assembly)}");
Assert(assembly.EntryPoint?.IsDefined(typeof(STAThreadAttribute), inherit: false) == true,
    "actual_windows_entrypoint_has_sta_for_native_file_dialogs");
Assert(assembly.EntryPoint!.Name == "Main" && assembly.EntryPoint.ReturnType == typeof(int),
    "windows_entrypoint_is_not_an_unannotated_async_bridge");
Console.WriteLine("LAUNCHER_ENTRYPOINT_TEST_OK nativeDialogs=STA headlessAsync=preserved");
var updateFailureChecks = await UpdateFailureTests.Run(assembly);
Console.WriteLine($"LAUNCHER_UPDATE_FAILURE_TESTS_OK checks={updateFailureChecks} installationStarted=false");
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
Console.WriteLine($"LAUNCHER_NOTICES_DIALOG_TESTS_OK checks={NoticesDialogTests.Run(assembly)} windowsVisible=0 shellAssociationUsed=false");

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
