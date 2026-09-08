using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;
using Netgrid.Windows;

if (args is not [var stubPath, var msiPath, var destination])
    throw new ArgumentException("usage: SetupBundleTool stub.exe product.msi new-setup.exe");
stubPath = Path.GetFullPath(stubPath);
msiPath = Path.GetFullPath(msiPath);
destination = Path.GetFullPath(destination);
if (File.Exists(destination)) throw new InvalidOperationException("setup_bundle_destination_exists");
using var stub = new FileStream(stubPath, FileMode.Open, FileAccess.Read, FileShare.Read);
using var msi = new FileStream(msiPath, FileMode.Open, FileAccess.Read, FileShare.Read);
var product = MsiBundleMetadata.Read(msiPath);
if (FileVersionInfo.GetVersionInfo(stubPath).FileVersion != product.ProductVersion.ToString(3) + ".0")
    throw new InvalidOperationException("setup_bundle_stub_version_mismatch");
var stage = destination + "." + Guid.NewGuid().ToString("N") + ".tmp";
try
{
    SetupBundle.Contents written;
    using (var output = new FileStream(stage, FileMode.CreateNew, FileAccess.ReadWrite, FileShare.None))
    {
        written = SetupBundle.Write(stub, msi, output, product);
        output.Flush(flushToDisk: true);
        if (SetupBundle.ReadVerified(output) != written) throw new InvalidOperationException("setup_bundle_write_verification_failed");
    }
    File.Move(stage, destination, overwrite: false);
    using var result = File.OpenRead(destination);
    Console.WriteLine(JsonSerializer.Serialize(new { ok = true, contents = written, sha256 = Convert.ToHexString(SHA256.HashData(result)).ToLowerInvariant() }));
}
finally { if (File.Exists(stage)) File.Delete(stage); }
