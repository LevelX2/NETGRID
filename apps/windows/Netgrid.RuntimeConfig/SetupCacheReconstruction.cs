using System.Diagnostics;
using System.Security.Cryptography;
using Netgrid.Windows;

namespace Netgrid.RuntimeConfig;

internal static class SetupCacheReconstruction
{
    public static void Store(string dataRoot, string programRoot, string productCode, string? source, string? expectedHash)
    {
        _ = InstalledSetupCache.PathFor(dataRoot, productCode);
        var hasSource = !string.IsNullOrEmpty(source);
        if (hasSource != !string.IsNullOrEmpty(expectedHash)) throw new InvalidOperationException("setup_cache_attestation_incomplete");
        var stubPath = Path.Combine(programRoot, "tools", "NETGRID.SetupStub.exe");
        var held = UpdateDataFiles.PinAncestors(Path.Combine(dataRoot, "config"));
        var stage = Path.Combine(dataRoot, "config", Guid.NewGuid().ToString("N") + ".setup.tmp");
        try
        {
            held.AddRange(UpdateDataFiles.PinAncestors(Path.GetDirectoryName(stubPath)!));
            // Product-code repair may run from Windows Installer's reduced
            // cached database. Reconstruct only from our full protected source.
            var msiRoot = Path.Combine(dataRoot, "config", "installer", productCode);
            held.AddRange(UpdateDataFiles.PinAncestors(msiRoot));
            var sources = Directory.GetFiles(msiRoot, "*.msi", SearchOption.TopDirectoryOnly);
            if (sources.Length != 1) throw new InvalidOperationException("setup_cache_msi_source_ambiguous");
            var msiPath = sources[0];
            using var stub = UpdateDataFiles.ReadLocked(stubPath);
            using var msi = UpdateDataFiles.ReadLocked(msiPath);
            var product = MsiBundleMetadata.Read(msiPath);
            if (product.ProductCode.ToString("B").ToUpperInvariant() != productCode ||
                FileVersionInfo.GetVersionInfo(stubPath).FileVersion != product.ProductVersion.ToString(3) + ".0")
                throw new InvalidOperationException("setup_cache_bundle_identity_mismatch");
            using (var output = new FileStream(stage, FileMode.CreateNew, FileAccess.ReadWrite, FileShare.None))
            {
                var written = SetupBundle.Write(stub, msi, output, product);
                output.Flush(flushToDisk: true);
                if (SetupBundle.ReadVerified(output) != written) throw new InvalidOperationException("setup_cache_bundle_write_mismatch");
            }
            string hash;
            using (var generated = UpdateDataFiles.ReadLocked(stage))
                hash = Convert.ToHexString(SHA256.HashData(generated)).ToLowerInvariant();
            if (hasSource)
            {
                held.AddRange(UpdateDataFiles.PinAncestors(Path.GetDirectoryName(source!)!));
                using var supplied = UpdateDataFiles.ReadLocked(source!);
                var suppliedHash = Convert.ToHexString(SHA256.HashData(supplied)).ToLowerInvariant();
                if (!suppliedHash.Equals(expectedHash, StringComparison.OrdinalIgnoreCase) || suppliedHash != hash)
                    throw new InvalidOperationException("setup_cache_hash_mismatch");
            }
            InstalledSetupCache.Store(dataRoot, productCode, stage, hash);
        }
        finally
        {
            try { if (File.Exists(stage)) File.Delete(stage); }
            finally { for (var index = held.Count - 1; index >= 0; index--) held[index].Dispose(); }
        }
    }
}
